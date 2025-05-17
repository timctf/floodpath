# 📦 FloodPath

> A Floodpath Recommendation System.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 📝 Table of Contents

- [🚀 Getting Started]
- [🔨 Usage]
- [🖥 Directory Structure]
- [✨ Contact]

## 🚀 Getting Started
### Prerequisites
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
- OneMap - API Token 
	- registration url: https://www.onemap.gov.sg/apidocs/register
	- replace the token "<YOUR_ONE_MAP_TOKEN>" in the following files:
		1. floodpath-processing\main.py -> line:454 
		2. floodpath-webapp\src\app\app.component.ts -> line:19
		3. floodpath-kafka\src\main\java\com\floodpath\util\ConvertUtil.java -> line:14	

### 📦 Build and run commands:
#### Database
	- create db named 'floodpath' in postgres and run sql scripts in the sql folder:
		- tbl_carpark_agg.sql
		- tbl_carpark_avail_data.sql
		- tbl_carpark_info_data.sql
		- tbl_rainfal_data.sql
		- tbl_rainfall_agg.sql
	
#### Kafka
	- start kafka and leave it running -> refer to floodpath-kafka/kafka_broker_tostart.txt
	- start kafka producer and consumers and leave it running
		- open up floodpath-kafka folder as a project in intellij
		- update configuration (with postgres db credentials, etc) at src/main/resources/application.properties
		- start debugging (com.floodpath.FloodPathKafkaApplication as the main class of the app)
	
#### Python 
	- update scheduler service postgres db credentials/config (floodpath-processing/scheduler.py, line 12-19)
	- start scheduler service (for scheduled spark jobs) and leave it running -> floodpath-processing/run_scheduler.bat
	- start telegram bot service and leave it running -> floodpath-processing/run_bot.bat
	- update postgres credentials/config in backend querying service (floodpath-processing/main.py, DB_CONFIG variable)
	- start backend querying service and leave it running -> floodpath-processing/run_app.bat

#### Angular
	- start frontend client -> floodpath-webapp/run_webapp.bat

## 🔨 Usage
	- Webapp: navigate to localhost:4200 in a browser to open the FloodPath visualisation webapp
	- Telegram: search for @floodpath_bot in telegram application

## 🖥 Directory Structure
- floodpath-kafka -> ingestion layer (kafka producer and consumer)
- floodpath-kafka -> processing layer (telegram bot, pyspark scheduled jobs, backend API service)
- floodpath-webapp -> visualization layer (frontend client)

## ✨ Contact
- Chan Ting Feng Tim (NCS) - tim.chan@ncs.com.sg
- Chang Jun Da (NCS) - junda.chang@ncs.com.sg | changjunda@gmail.com
- Lee Shu Yee (NCS) - shuyee.lee@ncs.com.sg
- Yan Wei Cheng (NCS) - weicheng.yan@ncs.com.sg
