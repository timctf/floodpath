from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from math import radians, cos, sin, asin, sqrt
import psycopg2
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from pydantic import BaseModel

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:4200"
]

weather_map = {
    0: "Clear",
    1: "Light rain",
    2: "Moderate rain",
    3: "Heavy rain",
    4: "Intense Rain",
    5: "Torrential Rain"
}

# Allow all CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

DB_CONFIG = {
    "dbname": "floodpath",
    "user": "postgres",
    "password": "pass1234",
    "host": "localhost"
}

# In-memory storage for the latest user location and current location
user_location_cache = {}
current_location_store = {}

def cleanse_carpark_data(rows):
    seen = set()
    cleaned = []
    for row in rows:
        record = dict(zip([
            "carparkNo", "carparkType", "address", "latitude", "longitude",
            "totalLots", "availableLots", "lot_type"
        ], row))
        if record["totalLots"] is not None and record["availableLots"] is not None:
            if 0 <= int(record["availableLots"]) <= int(record["totalLots"]):
                record["carparkNo"] = record["carparkNo"].strip() if record["carparkNo"] else None
                record["carparkType"] = record["carparkType"].strip() if record["carparkType"] else None
                record["address"] = record["address"].strip() if record["address"] else None
                record["latitude"] = float(record["latitude"])
                record["longitude"] = float(record["longitude"])
                record["totalLots"] = int(record["totalLots"])
                record["availableLots"] = int(record["availableLots"])
                key = (record["carparkNo"])
                if key not in seen:
                    seen.add(key)
                    cleaned.append(record)
    return cleaned

def cleanse_flood_data(rows):
    seen = set()
    cleaned = []
    for row in rows:
        record = dict(zip(["latitude", "longitude", "label"], row))
        if record["latitude"] is not None and record["longitude"] is not None:
            if record["label"]:
                record["label"] = record["label"].strip()
            key = (record["latitude"], record["longitude"], record["label"])
            if key not in seen:
                seen.add(key)
                cleaned.append(record)
    return cleaned

def cleanse_rainfall_data(rows):
    seen = set()
    cleaned = []
    for row in rows:
        record = dict(zip(["station_id", "latitude", "longitude", "recorded_datetime", "rainfall_mm"], row))
        if record["latitude"] is not None and record["longitude"] is not None and record["recorded_datetime"] is not None:
            if record["rainfall_mm"] is not None and record["rainfall_mm"] >= 0:
                key = (record["station_id"], record["recorded_datetime"])
                if key not in seen:
                    seen.add(key)
                    cleaned.append(record)
    return cleaned

@app.get("/carparks")
def get_carparks(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=3000),
    carpark_type: Optional[str] = Query(None, description="Filter by carpark type (e.g. MULTI-STOREY CAR PARK)")
):
    offset = (page - 1) * page_size
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # base_query = """
    #     SELECT i.carparkno, i.carparktype, i.address, i.latitude, i.longitude,
    #            a.totallots, a.lotsavailable, a.lotstype
    #     FROM tbl_carpark_info_data i
    #     JOIN tbl_carpark_avail_data a ON i.carparkno = a.carparkno
    #     WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND a.lotstype = 'C'
    # """
    base_query = """ 
        SELECT carparkno, carparktype, address, latitude, longitude,
                totallots, lotsavailable, lotstype, recordeddatetime
            FROM (  
            SELECT i.carparkno, i.carparktype, i.address, i.latitude, i.longitude,
                a.totallots, a.lotsavailable, a.lotstype, a.recordeddatetime,
                RANK() OVER (PARTITION BY a.carparkno ORDER BY a.recordeddatetime DESC) AS rn
            FROM tbl_carpark_info_data i
            JOIN tbl_carpark_avail_data a ON i.carparkno = a.carparkno
            WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND a.lotstype = 'C' AND i.carparktype = %s
        ) WHERE rn = 1
    """
    where_clause = " AND 1=1 " if carpark_type else ""
    order_pagination = "ORDER BY recordeddatetime DESC LIMIT %s OFFSET %s"

    query = f"{base_query} {where_clause} {order_pagination}"
    params = [carpark_type, page_size, offset] if carpark_type else [page_size, offset]

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = cleanse_carpark_data(rows)

    base_url = "/carparks"
    links = {
        "self": f"{base_url}?page={page}&page_size={page_size}" + (f"&carpark_type={carpark_type}" if carpark_type else ""),
        "next": f"{base_url}?page={page + 1}&page_size={page_size}" + (f"&carpark_type={carpark_type}" if carpark_type else ""),
        "prev": f"{base_url}?page={max(page - 1, 1)}&page_size={page_size}" + (f"&carpark_type={carpark_type}" if carpark_type else "")
    }

    return {
        "page": page,
        "page_size": page_size,
        "carpark_type": carpark_type,
        "links": links,
        "results": results
    }

@app.get("/flood-prone-areas")
def get_flood_areas(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Optional label filter (e.g. 'Bukit')")
):
    offset = (page - 1) * page_size
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    if search:
        query = """
            SELECT latitude, longitude, label
            FROM flood_prone_areas
            WHERE label ILIKE %s
            ORDER BY label ASC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (f"%{search}%", page_size, offset))
    else:
        query = """
            SELECT latitude, longitude, label
            FROM flood_prone_areas
            ORDER BY label ASC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (page_size, offset))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = cleanse_flood_data(rows)

    return {
        "page": page,
        "page_size": page_size,
        "results": results
    }

@app.get("/rainfall")
def get_rainfall(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    station: Optional[str] = Query(None, description="Optional filter by station ID")
):
    offset = (page - 1) * page_size
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    if station:
        query = """
            SELECT stationid, latitude, longitude, recordeddatetime, value
            FROM tbl_rainfall_data
            WHERE stationid = %s
            ORDER BY recordeddatetime DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (station, page_size, offset))
    else:
        query = """
            SELECT stationid, latitude, longitude, recordeddatetime, value
            FROM tbl_rainfall_data
            ORDER BY recordeddatetime DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (page_size, offset))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = cleanse_rainfall_data(rows)

    return {
        "page": page,
        "page_size": page_size,
        "station": station,
        "results": results
    }

def haversine(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of Earth in kilometers
    return c * r

@app.get("/nearest-carpark")
def get_nearest_carpark(
    latitude: float = Query(..., description="User's current latitude"),
    longitude: float = Query(..., description="User's current longitude")
):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    query = """
        SELECT carparkno, carparktype, address, latitude, longitude,
                totallots, lotsavailable, lotstype, recordeddatetime
        FROM (
            SELECT i.carparkno, i.carparktype, i.address, i.latitude, i.longitude,
                a.totallots, a.lotsavailable, a.lotstype, a.recordeddatetime,
                RANK() OVER (PARTITION BY a.carparkno ORDER BY a.recordeddatetime DESC) AS rn
            FROM tbl_carpark_info_data i
            JOIN tbl_carpark_avail_data a ON i.carparkno = a.carparkno
            WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND a.lotstype = 'C' AND i.carparktype = 'MULTI-STOREY CAR PARK'
        ) WHERE rn = 1
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {"message": "No carpark data available."}

    carparks = [
        {
            "carparkno": row[0],
            "carparktype": row[1],
            "address": row[2],
            "latitude": float(row[3]),
            "longitude": float(row[4]),
            "totallots": int(row[5]),
            "lotsavailable": int(row[6]),
            "lotstype": row[7],
            "distance_km": haversine(latitude, longitude, float(row[3]), float(row[4]))
        }
        for row in rows if row[3] is not None and row[4] is not None
    ]

    radius_km = 0.2
    nearest = None
    while not nearest and radius_km <= 30.0:
        within_radius = [c for c in carparks if c["distance_km"] <= radius_km]
        if within_radius:
            nearest = min(within_radius, key=lambda c: c["distance_km"])
        else:
            radius_km += 0.2

    if not nearest:
        return {"message": "No carpark found within 5km radius."}

    return {
        "fromLatitude": latitude,
        "fromLongitude": longitude,
        "toLatitude": nearest["latitude"],
        "toLongitude": nearest["longitude"],
        "date": datetime.now().strftime("%m-%d-%Y"),
        "time": datetime.now().time().strftime("%H:%M:%S"),
        "notes": f"Nearest carpark is {nearest['carparkno']} located at {nearest['address']} ({nearest['distance_km']:.2f} km away)."
    }

@app.get("/rainfall-nearby")
def get_rainfall_nearby(
    latitude: float = Query(..., description="User's current latitude"),
    longitude: float = Query(..., description="User's current longitude")
):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    query = """
        SELECT stationid, latitude, longitude, recordeddatetime, value
        FROM (
            SELECT i.stationid, i.latitude, i.longitude, i.recordeddatetime, i.value,
                RANK() OVER (PARTITION BY i.stationid ORDER BY i.recordeddatetime DESC) AS rn
            FROM tbl_rainfall_data i
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND value > 0
        ) WHERE rn = 1
    """

    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {"message": "No rainfall data available."}

    radius_km = 0.2
    rainfall_points = []
    while not rainfall_points and radius_km <= 2.0:
        for row in rows:
            distance = haversine(latitude, longitude, row[1], row[2])
            if distance <= radius_km:
                rainfall_points.append({
                    "stationid": row[0],
                    "latitude": row[1],
                    "longitude": row[2],
                    "recordeddatetime": row[3],
                    "value": row[4],
                    "label": weather_map.get(row[4], ""),
                    "distance_km": round(distance, 3)
                })
        if not rainfall_points:
            radius_km += 0.2

    if not rainfall_points:
        return {"message": "No rainfall detected within 2km radius."}

    return {
        "fromLatitude": latitude,
        "fromLongitude": longitude,
        "results": rainfall_points
    }

@app.get("/rainfall-islandwide")
def get_rainfall_islandwide():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    query = """
        SELECT stationid, latitude, longitude, recordeddatetime, value
        FROM (
            SELECT i.stationid, i.latitude, i.longitude, i.recordeddatetime, i.value,
                RANK() OVER (PARTITION BY i.stationid ORDER BY i.recordeddatetime DESC) AS rn
            FROM tbl_rainfall_data i
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND value > 0
        ) WHERE rn = 1
    """

    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {"message": "No rainfall data available."}

    rainfall_points = [
        {
            "stationid": row[0],
            "latitude": row[1],
            "longitude": row[2],
            "recordeddatetime": row[3],
            "value": row[4],
            "label": weather_map.get(row[4], ""),
        }
        for row in rows if row[1] is not None and row[2] is not None
    ]

    return {
        "results": rainfall_points
    }

@app.get("/location-to-coordinates")
def get_coordinates_from_location(
    location: str = Query(..., description="Location string sent from Telegram bot")
):
    geolocator = Nominatim(user_agent="floodpath-locator")
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)
    geo = geocode(f"{location}, Singapore")
    if not geo:
        return {"message": "Location not found."}

    result = {
        "latitude": geo.latitude,
        "longitude": geo.longitude,
        "label": geo.address
    }

    # Store latest user-provided location in memory
    user_location_cache["latest"] = result

    return result 

@app.get("/location-latest")
def get_latest_cached_location():
    if "latest" not in user_location_cache:
        return {"message": "No cached location found."}
    return user_location_cache["latest"]

@app.get("/current-location")
def store_current_location(
    latitude: float = Query(..., description="Latitude from Telegram location"),
    longitude: float = Query(..., description="Longitude from Telegram location")
):
    geolocator = Nominatim(user_agent="floodpath-locator")
    geo = geolocator.reverse((latitude, longitude), language="en")
    label = geo.address
    if not geo:
        label = "No specific location found."

    result = {
        "latitude": latitude,
        "longitude": longitude,
        "label": label
    }

    current_location_store["latest"] = result
    return result

@app.get("/current-location-latest")
def get_latest_cached_location():
    if "latest" not in user_location_cache:
        return {"message": "No cached location found."}
    result = current_location_store["latest"]
    current_location_store["latest"] = {} # Empty after calling API
    return result


# RUN THE APP: uvicorn main:app --reload
# EXAMPLE CARPARKS API CALL: http://localhost:8000/carparks?page=1&page_size=50&carpark_type=MULTI-STOREY CAR PARK
# EXAMPLE FLOOD AREA API CALL: http://localhost:8000/flood-prone-areas?page=1&page_size=5
# EXAMPLE RAINFALL API CALL: http://localhost:8000/rainfall?page=1&page_size=10&station=S10
# EXAMPLE NEAREST CARPARK: http://localhost:8000/nearest-carpark?latitude=1.2974687910746303&longitude=103.85375891720288
