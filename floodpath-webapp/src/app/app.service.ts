import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { CarparkLocation, DirectionRequest, DirectionResponse, FloodArea, FloodProneArea, RainArea, Telelocation } from "./app.model";

@Injectable({
    providedIn: 'root'
})
export class AppService {
    appUrl = 'http://localhost:8000/';

    constructor(private http: HttpClient) {}

    getCarParkData(): Observable<CarparkLocation[]> {
        return this.http.get<CarparkLocation[]>(this.appUrl + 'carparks?page=1&page_size=3000&carpark_type=MULTI-STOREY CAR PARK', {});
        //http://localhost:8000/carparks?page=1&page_size=50&carpark_type=MULTI-STOREY CAR PARK
        // //Mocking
        // let cp1 : CarparkLocation = {
        //     carparkNo: 'B76', 
        //     carparkType: 'MULTI-STOREY CAR PARK', 
        //     address: 'BLK 761A BEDOK RESERVOIR VIEW', 
        //     latitude: 1.335899564300343,
        //     longitude: 103.93441895740379,
        //     availableLots: 50,
        //     totalLots: 100
        // };
        // let cp2 : CarparkLocation = {
        //     carparkNo: 'B77', 
        //     carparkType: 'MULTI-STOREY CAR PARK', 
        //     address: 'BLK 765A BEDOK RESERVOIR VIEW', 
        //     latitude: 1.3356910123179633,
        //     longitude: 103.93633367546337,
        //     availableLots: 50,
        //     totalLots: 100
        // };
        // let cp3 : CarparkLocation = {
        //     carparkNo: 'B78', 
        //     carparkType: 'MULTI-STOREY CAR PARK', 
        //     address: 'BLK 769A BEDOK RESERVOIR VIEW', 
        //     latitude: 1.335608884799405,
        //     longitude: 103.93838375965704,
        //     availableLots: 50,
        //     totalLots: 100
        // };
        // let cp4 : CarparkLocation = {
        //     carparkNo: 'B79', 
        //     carparkType: 'MULTI-STOREY CAR PARK', 
        //     address: 'BLK 772A BEDOK RESERVOIR VIEW', 
        //     latitude: 1.3367761554500215,
        //     longitude: 103.93740660996897,
        //     availableLots: 50,
        //     totalLots: 1000
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next([
        //         cp1,
        //         cp2,
        //         cp3,
        //         cp4
        //       ]);
        //       observer.complete();
        //     }, 1000); // Simulate a 2-second delay
        //   });
        
    }

    getFloodProneAreaData(): Observable<FloodProneArea[]> {
        return this.http.get<FloodProneArea[]>(this.appUrl + 'flood-prone-areas?page=1&page_size=100', {});

        //Mocking
        // let a1 : FloodProneArea = {
        //     latitude: 1.3378942684203285, 
        //     longitude: 103.9392711663887, 
        //     label: 'Floodprone Area (Tampines GreenOpal)'
        // };
        // let a2 : FloodProneArea = {
        //     latitude: 1.340446775542536, 
        //     longitude: 103.9355366807248, 
        //     label: 'Floodprone Area (Tampines GreenJade)'
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next([
        //         a1,
        //         a2
        //       ]);
        //       observer.complete();
        //     }, 1000); // Simulate a 2-second delay
        //   });
    }

    getFloodAreaData(): Observable<FloodArea> {
        return this.http.get<FloodArea>(this.appUrl + 'location-latest', {});

        //Mocking
        // let a1 : FloodArea = {
        //     latitude: 1.312505602711895, 
        //     longitude: 103.9410296361213, 
        //     label: 'Flooded Area (Bayshore MRT)'
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next([
        //         a1
        //       ]);
        //       observer.complete();
        //     }, 1000); // Simulate a 2-second delay
        //   });
    }

    getRainAreaData(lat: number, lng: number): Observable<RainArea[]> {
        return this.http.get<RainArea[]>(this.appUrl + 'rainfall-nearby?latitude='+lat+'&longitude='+lng, {});

        //Mocking
        // let a1 : FloodArea = {
        //     latitude: 1.312505602711895, 
        //     longitude: 103.9410296361213, 
        //     label: 'Heavy shower'
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next([
        //         a1
        //       ]);
        //       observer.complete();
        //     }, 1000); // Simulate a 2-second delay
        //   });
    }

    getSuggestRoute(payload: DirectionRequest): Observable<DirectionResponse> {
        return this.http.get<DirectionResponse>(this.appUrl + 'nearest-carpark?latitude='+payload.fromLatitude+'&longitude='+payload.fromLongitude, {});

        //Mocking
        // let a1 : DirectionResponse = {
        //     fromLatitude: payload.fromLatitude,
        //     fromLongitude: payload.fromLongitude,
        //     toLatitude: 1.335899564300343,
        //     toLongitude: 103.93441895740379,
        //     date: '05-04-2025', //MM-dd-yyyy
        //     time: '11:46:00', //hh:mm:ss
        //     notes: 'Move ~'
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next(
        //         a1
        //       );
        //       observer.complete();
        //     }, 2000); // Simulate a 2-second delay
        //   });
    }

    getIslandWideRainAreaData(): Observable<RainArea[]> {
        return this.http.get<RainArea[]>(this.appUrl + 'rainfall-islandwide', {});

        //Mocking
        // let a1 : FloodArea = {
        //     latitude: 1.312505602711895, 
        //     longitude: 103.9410296361213, 
        //     label: 'Heavy shower'
        // };

        // return new Observable(observer => {
        //     setTimeout(() => {
        //       observer.next([
        //         a1
        //       ]);
        //       observer.complete();
        //     }, 1000); // Simulate a 2-second delay
        //   });
    }

    getTelelocationData(): Observable<Telelocation> {
        return this.http.get<Telelocation>(this.appUrl + 'current-location-latest', {});
    }


}