export interface CarparkLocation {
    carparkNo: string;
    carparkType: string;
    address: string;
    latitude: number;
    longitude: number;
    availableLots: number;
    totalLots: number;
}

export interface FloodProneArea {
    latitude: number;
    longitude: number;
    label: string;
}

export interface FloodArea {
    latitude: number;
    longitude: number;
    label: string;
}

export interface Telelocation {
    latitude: number;
    longitude: number;
    label: string;
}

export interface RainArea {
    latitude: number;
    longitude: number;
    rainfall: RainfallPoint[];
}

export interface DirectionRequest {
    fromLatitude: number;
    fromLongitude: number;
}

export interface DirectionResponse {
    fromLatitude: number;
    fromLongitude: number;
    toLatitude: number;
    toLongitude: number;
    date: string;
    time: string;
    notes: string;
}

export interface RainfallPoint {
    stationid: string;
    latitude: number;
    longitude: number;
    recordeddatetime: string;
    value: number;
    label: string;
    distance_km: string;
}

export interface OneMapRouteResponse {
    status_message: string;
    route_geometry: string;
    status: number;
    route_instructions: RouteInstruction[][];
    route_name: string[];
    route_summary: RouteSummary;
    viaRoute: string;
    subtitle: string;
}

export type RouteInstruction = [
action: string,                 // e.g., "Head", "Right"
roadName: string,              // e.g., "BEDOK RESERVOIR VIEW"
distance: number,              // distance to this step in meters
location: string,              // "lat,lng" format string
cumulativeDistance: number,    // distance from start
distanceText: string,          // e.g., "6m"
startDirection: string,        // e.g., "East"
endDirection: string,          // e.g., "North"
mode: string,                  // e.g., "driving"
instructionText: string        // Full turn-by-turn text
];

export interface RouteSummary {
    start_point: string;
    end_point: string;
    total_time: number;      // in seconds
    total_distance: number;  // in meters
}