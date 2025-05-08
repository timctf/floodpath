from pyspark.sql import SparkSession
from pyspark.sql.window import Window
from pyspark.sql.functions import rank
import schedule
import time
import psycopg2
# import os

# os.environ['PYSPARK_SUBMIT_ARGS'] = '--packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.0-preview1 carpark_agg_listener.py'

# postgres db config (for connection via spark)
db_name = "floodpath"
host = "localhost"
port = "5432"
jdbc_url = "jdbc:postgresql://" + host + ":" + port + "/" + db_name
username = "postgres"
password = "pass1234"
driver_class = "org.postgresql.Driver"
jdbc_driver_path = "drivers/postgresql-42.7.5.jar" 

# tables
rainfall_data_table = "TBL_RAINFALL_DATA"
carpark_info_data_table = "TBL_CARPARK_INFO_DATA"
carpark_avail_data_table = "TBL_CARPARK_AVAIL_DATA"
carpark_agg_table = "TBL_CARPARK_AGGREGATED"
rainfall_agg_table = "TBL_RAINFALL_AGGREGATED"

# kafka broker config
kafka_brokers = "localhost:9092"
topic_name = "carparkAgg";

DB_CONFIG = {
    "dbname": db_name,
    "user": username,
    "password": password,
    "host": host
}

def carpark_agg_process():
    print("[carpark_agg_process] Carpark aggregation process started")

    sparkPostgres = SparkSession.builder \
        .appName("PostgreSQLConnection") \
        .config("spark.jars", jdbc_driver_path) \
        .getOrCreate()
    
    # sparkReader = SparkSession.builder \
    #     .appName("KafkaReader") \
    #     .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.0") \
    #     .getOrCreate()
    
    try:
        # carpark info - retrieve from db
        carparkInfoDf = sparkPostgres.read.format("jdbc") \
            .option("url", jdbc_url) \
            .option("dbtable", carpark_info_data_table) \
            .option("user", username) \
            .option("password", password) \
            .option("driver", driver_class) \
            .load()
        
        # retrieve raw carpark avail data from in db
        carparkAvailDf = sparkPostgres.read.format("jdbc") \
            .option("url", jdbc_url) \
            .option("dbtable", carpark_avail_data_table) \
            .option("user", username) \
            .option("password", password) \
            .option("driver", driver_class) \
            .load()
        
        # retrieve carpark avail data from kafka topic
        # carparkAvailDf = sparkReader.read \
        #     .format("kafka") \
        #     .option("kafka.bootstrap.servers", kafka_brokers) \
        #     .option("subscribe", topic_name) \
        #     .option("startingOffsets", "earliest") \
        #     .option("endingOffsets", "latest") \
        #     .load()
        
        # processing/cleansing of data
        joinedDf = carparkInfoDf.join(carparkAvailDf, on=carparkInfoDf["carparkno"] == carparkAvailDf["carparkno"], how='inner')
        baseFilteredDf = joinedDf.filter("lotstype = 'C'") \
            .filter(carparkInfoDf["latitude"].isNotNull()) \
            .filter(carparkInfoDf["longitude"].isNotNull()) \
            .filter("carparktype = 'MULTI-STOREY CAR PARK'")
        windowSpec = Window.partitionBy(carparkAvailDf["carparkno"]).orderBy(carparkAvailDf["recordeddatetime"].desc())
        rankedDf = baseFilteredDf.withColumn("rn", rank().over(windowSpec))
        rankFilteredDf = rankedDf.filter("rn = 1")
        selectDf = rankFilteredDf.select(
            carparkInfoDf["carparkno"], 
            carparkInfoDf["carparktype"], 
            carparkInfoDf["address"], 
            carparkInfoDf["latitude"], 
            carparkInfoDf["longitude"],
            carparkAvailDf["totallots"],
            carparkAvailDf["lotsavailable"],
            carparkAvailDf["lotstype"],
            carparkAvailDf["recordeddatetime"]
        )
        print("[carpark_agg_process] carpark info and availability data cleansed and aggregated")

        # write into db
        selectDf.write.format("jdbc") \
            .option("url", jdbc_url) \
            .option("dbtable", carpark_agg_table) \
            .option("user", username) \
            .option("password", password) \
            .option("driver", driver_class) \
            .mode("overwrite").save()
            # .mode("append").save()
        print("[carpark_agg_process] Updated carpark aggregated table in db")

        sparkPostgres.stop()
        # sparkReader.stop()
        print("[carpark_agg_process] Carpark aggregation process ended")
    except Exception as e:
        print(f"[carpark_agg_process] Error: {e}")

def rainfall_agg_process():
    print("[rainfall_agg_process] Rainfall aggregation process started")
    sparkPostgres = SparkSession.builder \
        .appName("PostgreSQLConnection") \
        .config("spark.jars", jdbc_driver_path) \
        .getOrCreate()
    
    try:
        # carpark info - retrieve from db
        rainfallDf = sparkPostgres.read.format("jdbc") \
            .option("url", jdbc_url) \
            .option("dbtable", rainfall_data_table) \
            .option("user", username) \
            .option("password", password) \
            .option("driver", driver_class) \
            .load()

        # processing/cleansing of data
        baseFilteredDf = rainfallDf \
            .filter(rainfallDf["latitude"].isNotNull()) \
            .filter(rainfallDf["longitude"].isNotNull())
        windowSpec = Window.partitionBy(rainfallDf["stationid"]).orderBy(rainfallDf["recordeddatetime"].desc())
        rankedDf = baseFilteredDf.withColumn("rn", rank().over(windowSpec))
        rankFilteredDf = rankedDf \
            .filter("rn = 1") \
            .filter("value > 0") # remove areas without precipitation
        selectDf = rankFilteredDf.select(
            rainfallDf["stationid"], 
            rainfallDf["latitude"], 
            rainfallDf["longitude"], 
            rainfallDf["recordeddatetime"], 
            rainfallDf["value"]
        )
        print("[rainfall_agg_process] Rainfall data cleansed and aggregated")

        # write into db
        selectDf.write.format("jdbc") \
            .option("url", jdbc_url) \
            .option("dbtable", rainfall_agg_table) \
            .option("user", username) \
            .option("password", password) \
            .option("driver", driver_class) \
            .mode("overwrite").save()
        print("[rainfall_agg_process] Updated rainfall aggregated table in db")

        sparkPostgres.stop()
        print("[rainfall_agg_process] Rainfall aggregation process ended")
    except Exception as e:
        print(f"[rainfall_agg_process] Error: {e}")

def main():
    print("[main] Scheduler service started")
    schedule.every(1).minutes.do(carpark_agg_process)
    schedule.every(1).minutes.do(rainfall_agg_process)

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
    print("[main] Scheduler service stopped")