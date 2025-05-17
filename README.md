Prerequisites:
- PostgreSQL
- pgAdmin (or any other DB client for managing PostgreSQL server)
- Kafka 2.13_4.00
- Java 17
- IntelliJ
- Python 3
    - Libraries: 
    - pip install pyspark
    - pip install geopy
    - pip install scheduler
    - pip install psycopg2
    - pip install fastapi
    - pip install pydantic
    - pip install requests
- Angular
- Node.js
    - run 'npm install' in terminal/cmd at floodpath-webapp (to install frontend libraries)

Build and run commands:
- create db named 'floodpath' in postgres and run sql scripts in the sql folder:
    - tbl_carpark_agg.sql
    - tbl_carpark_avail_data.sql
    - tbl_carpark_info_data.sql
    - tbl_rainfal_data.sql
    - tbl_rainfall_agg.sql
- start kafka and leave it running -> refer to floodpath-kafka/kafka_broker_tostart.txt
- start kafka producer and consumers and leave it running
    - open up floodpath-kafka folder as a project in intellij
    - update configuration (with postgres db credentials, etc) at src/main/resources/application.properties
    - start debugging (com.floodpath.FloodPathKafkaApplication as the main class of the app)
- update scheduler service postgres db credentials/config (floodpath-processing/scheduler.py, line 12-19)
- start scheduler service (for scheduled spark jobs) and leave it running -> floodpath-processing/run_scheduler.bat
- start telegram bot service and leave it running -> floodpath-processing/run_bot.bat
- update postgres credentials/config in backend querying service (floodpath-processing/main.py, DB_CONFIG variable)
- start backend querying service and leave it running -> floodpath-processing/run_app.bat
- start frontend client -> run 'npm start' in terminal/cmd at floodpath-webapp
- navigate to localhost:4200 in a browser to open the FloodPath visualisation webapp

Directory Structure:
- floodpath-kafka -> ingestion layer (kafka producer and consumer)
- floodpath-kafka -> processing layer (telegram bot, pyspark scheduled jobs, backend API service)
- floodpath-webapp -> visualization layer (frontend client)

Contact:
- Chan Ting Feng Tim (NCS) - tim.chan@ncs.com.sg
- Chang Jun Da (NCS) - junda.chang@ncs.com.sg
- Lee Shu Yee (NCS) - shuyee.lee@ncs.com.sg
- Yan Wei Cheng (NCS) - weicheng.yan@ncs.com.sg
