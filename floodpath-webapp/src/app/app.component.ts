import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { LatLng } from 'leaflet';
import { CarparkLocation, DirectionRequest, DirectionResponse, FloodArea, FloodProneArea, OneMapRouteResponse, RainArea } from './app.model';
import { AppService } from './app.service';
import { Observable, Subscription, map, of } from 'rxjs';
import * as polyline from '@mapbox/polyline';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy  {
  
  private token: string | null = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzOGQ1OTk1MzkzZTg0NWQ4NTcwMzI0MzIzNGMxZGQ1OSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTc0NjMyNjU4NiwiZXhwIjoxNzQ2NTg1Nzg2LCJuYmYiOjE3NDYzMjY1ODYsImp0aSI6Inp4UldiVzNxUDBKZjh6a1UiLCJ1c2VyX2lkIjo2OTA1LCJmb3JldmVyIjpmYWxzZX0.lqKP4cVUC7HUvoxpGRaWMadEQhwAQbjTLEE_pCIeFGM';

  private map!: L.Map; // <-- Main map
  personIcon!: L.Icon; // <-- Person position icon
  carparkIcon!: L.Icon; // <-- Carpark position icon

  private userMarker?: L.Marker; // <-- Track the GPS marker
  public lat: number | null = null; // <-- Latitude of user pos
  public lng: number | null = null; // <-- Longitude of user pos
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  routeLine: L.Polyline | null = null;
  startMarker: L.Marker | null = null;
  endMarker: L.Marker | null = null;
  
  routeVisible = false; // tracks if route should be shown
  routeDetails: OneMapRouteResponse = null;
  
  dropMode: boolean = false; // tracks if user is in "drop mode"
  
  snackbarMessage: string = '';
  snackbarVisible: boolean = false;

  loadingCarparks = true;
  loadingFloodProneAreas = true;
  loadingFloodAreas = true;
  loadingRainAreas = false;
  loadingRoute = false;

  carparks: CarparkLocation[] = [];
  floodProneAreas: FloodProneArea[] = [];
  floodAreas: FloodArea[] = [];
  rainAreas: RainArea = null;

  private subscriptions: Subscription[] = [];
  constructor(
    private appService: AppService
  ) {}

  ngOnInit(): void {
    //Load token once
    // const oneMapAuthUrl = "https://www.onemap.gov.sg/api/auth/post/getToken";
    // const data = {
    //   email: "",
    //   password: ""
    // };

    // fetch(oneMapAuthUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(data)
    // })
    // .then(response => {
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! Status: ${response.status}`);
    //   }
    //   return response.json();  // Parse response as JSON
    // })
    // .then(data => {
    //   console.log(data);  // Log the response data to the console

    //   console.log('Token loaded:', data.access_token);
    //   this.token = data.access_token;

      this.initIcons();
      this.initMap();
      this.loadCarParkData();
      this.loadFloodProneAreaData();
      this.loadFloodAreaData();
    // })
    // .catch(error => {
    //   console.error('Error:', error);  // Log any errors
    // });

  }

  ngOnDestroy(): void {
    // Loop and unsubscribe from all
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngDoCheck(): void {
    if (
      this.lat !== null && this.lng !== null &&
      (this.lat !== this.lastLat || this.lng !== this.lastLng)
    ) {
      this.lastLat = this.lat;
      this.lastLng = this.lng;
      this.onPositionChanged(this.lat, this.lng);
    }
  }

  onPositionChanged(lat: number, lng: number) {
    console.log('Updated coords:', lat, lng);

    this.loadingRoute = true;
    let req: DirectionRequest = {
      fromLatitude: lat,
      fromLongitude: lng
    }

    this.appService.getSuggestRoute(req).subscribe((res: DirectionResponse) => {

      //call onemap
      fetch("https://www.onemap.gov.sg/api/public/routingsvc/route?start="+res.fromLatitude+"%2C"+res.fromLongitude+"&end="+res.toLatitude+"%2C"+res.toLongitude+"&routeType=drive&date="+res.date+"&time="+res.time+"&mode=TRANSIT&numItineraries=3", {
        method: 'GET',
        headers: {
          'Authorization': this.token,  // API token for authorization
        }
      })
      .then(response => response.json())  // Parse response as JSON
      .then(data => {
        console.log(data); 
        this.loadingRoute = false;
        this.routeDetails = data;

        this.displayRoute();
      })
      .catch(error => {
        console.error('Error:', error); 
        this.loadingRoute = false;
      });

    });

    this.loadRainAreaData(lat, lng);

  
  }

  displayRoute(): void {
    // show card on map

    this.routeLine?.remove();
    this.startMarker?.remove();
    this.endMarker?.remove();

    const coords = polyline.decode(this.routeDetails.route_geometry);
    const latLngs = coords.map(([lat, lng]) => L.latLng(lat, lng));

    this.routeLine = L.polyline(latLngs, { color: 'blue' }).addTo(this.map);
    this.map.fitBounds(this.routeLine.getBounds());

    const start = (this.routeDetails.route_instructions[0][3] as unknown as string).split(',').map(Number);
    const end = (this.routeDetails.route_instructions[this.routeDetails.route_instructions.length - 1][3] as unknown as string).split(',').map(Number);

    this.startMarker = L.marker([start[0], start[1]]).addTo(this.map).bindPopup('Start');
    this.endMarker = L.marker([end[0], end[1]]).addTo(this.map).bindPopup('End');

    this.routeVisible = true;
  }

  clearRoute(): void {
    this.routeDetails = null;
    this.routeLine?.remove();
    this.startMarker?.remove();
    this.endMarker?.remove();
  }

  getDuration(seconds: number): string {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  }

  initIcons(): void {
    this.personIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/18292/18292370.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    this.carparkIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2205/2205084.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  initMap(): void {
    let sw = L.latLng(1.144, 103.535);
    let ne = L.latLng(1.494, 104.502);
    let bounds = L.latLngBounds(sw, ne);

    this.map = L.map('map', {
      center: L.latLng(1.2868108, 103.8545349),
      zoom: 14,
      zoomControl: false // ✅ disables default zoom control at top left
    });

    this.map.setMaxBounds(bounds);

    let basemap = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', {
      detectRetina: true,
      maxZoom: 19,
      minZoom: 11,
      /** DO NOT REMOVE the OneMap attribution below **/
      attribution: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'
    });

    basemap.addTo(this.map);

    // Re-add it wherever you want
    L.control.zoom({
      position: 'bottomright' // 👈 change this to your desired position
    }).addTo(this.map);

    // Map click listener - only active during dropMode
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.dropMode) return;

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      this.lat = lat;
      this.lng = lng;

      // Remove existing marker
      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
      }

      // Drop the person icon
      this.userMarker = L.marker([lat, lng], { icon: this.personIcon })
        .addTo(this.map)
        .bindPopup('Your dropped pin location');
        //.openPopup();
      
      // Center the map
      this.map.setView([lat, lng], 16);

      this.showSnackbar('Updated location via drop pin.', 2000);

      this.dropMode = false; // deactivate drop mode after one click
    });

  }

  loadCarParkData() {
    this.subscriptions.push(
      this.appService.getCarParkData().subscribe((res: any) => {
        this.carparks = res.results;
        this.loadingCarparks = false;
        
        //Populate data
        this.plotCarparkData();
      })
    );
  }

  loadFloodProneAreaData() {
    this.subscriptions.push(
      this.appService.getFloodProneAreaData().subscribe((res: any) => {
        this.floodProneAreas = res.results;
        this.loadingFloodProneAreas = false;
        
        //Populate data
        this.plotFloodProneAreaData();
      })
    );
  }

  loadFloodAreaData() {
    this.subscriptions.push(
      this.appService.getFloodAreaData().subscribe((res: FloodArea[]) => {
        this.floodAreas = res;
        this.loadingFloodAreas = false;
        
        //Populate data
        this.plotFloodAreaData();
      })
    );
  }

  loadRainAreaData(lat: number, lng: number) {
    this.loadingRainAreas = true;
    this.subscriptions.push(
      this.appService.getRainAreaData(lat, lng).subscribe((res: any) => {
        let ra: RainArea = {
          latitude: res.fromLatitude,
          longitude: res.fromLongitude,
          rainfall: res.results
        }
        
        this.rainAreas = ra;
        this.loadingRainAreas = false;
        
        //Populate data
        this.plotRainAreaData();
      })
    );
  }
  

  locateUser(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.lat = lat;
          this.lng = lng;

          // Clear previous marker if it exists
          this.clearUserMarker();

          // Add a marker
          this.userMarker = L.marker([lat, lng], {icon: this.personIcon})
          .addTo(this.map)
          .bindPopup('You are here!');
          //.openPopup();

          // Center the map
          this.map.setView([lat, lng], 16);
          this.map.flyTo([lat, lng], 16);
          
          this.showSnackbar('Loaded your location.', 2000);

        },
        error => {
          console.error('Geolocation error:', error);
          this.showSnackbar('Error loading geocoordinates.', 2000);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  clearUserMarker(): void {
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
      this.userMarker = undefined;
    }
  }

  updateLatLng(): void {
    if (this.lat == null || this.lng == null) {
      this.showSnackbar('Please enter a valid lat/lng.', 2000);
      return;
    }
  
    const lat = Number(this.lat);
    const lng = Number(this.lng);
  
    if (isNaN(lat) || isNaN(lng)) {
      this.showSnackbar('Coordinates must be number.', 2000);
      return;
    }
  
    // Clear previous marker if it exists
    this.clearUserMarker();

    // Add new marker
    this.userMarker = L.marker([lat, lng], {icon: this.personIcon})
      .addTo(this.map)
      .bindPopup('Your entered location');
      //.openPopup();

    // Set map view
    this.map.setView([lat, lng], 16);
    this.map.flyTo([lat, lng], 16);

    this.showSnackbar('Updated pin to your entered location.', 2000);

  }

  toggleDropMode(): void {
    this.dropMode = !this.dropMode;

    if (this.dropMode) {
      this.showSnackbar('Click on the map to drop pin.');

      //remember existing user marker to revert if got existing
      if(this.userMarker) {
        this.userMarker.removeFrom(this.map);
      }
    } else {
      this.hideSnackbar();

      //remember existing user marker to revert if got existing
      console.log('before revert');
      if(this.userMarker) {
        console.log('revert');
        this.userMarker.addTo(this.map);

        // Center the map
        const position = this.userMarker?.getLatLng();
        if(position) {
          this.map.setView([position.lat, position.lng], 16);
        }
      }
    }
  }

  plotCarparkData(): void {
    console.log('plotCarparkData1');
    if (this.carparks && this.carparks.length > 0) {
      console.log('plotCarparkData2');
      this.carparks.forEach(carpark => {
        L.marker([carpark.latitude, carpark.longitude], {icon: this.carparkIcon}).addTo(this.map)
          .bindPopup(`<b>${carpark.carparkNo} - (${carpark.carparkType})</b><br>${carpark.address}<br>Carpark Availability: ${carpark.availableLots} / ${carpark.totalLots}`);
          //.openPopup();
      });
    }
  }

  plotFloodProneAreaData(): void {
    console.log('plotFloodProneAreaData1');
    if (this.floodProneAreas && this.floodProneAreas.length > 0) {
      console.log('plotFloodProneAreaData2');
      this.floodProneAreas.forEach(floodProneArea => {
        this.drawRadius(floodProneArea.latitude, floodProneArea.longitude, 0.2, 0.05, 'green', 'green', floodProneArea.label);
      });
    }
  }

  plotFloodAreaData(): void {
    console.log('plotFloodAreaData1');
    if (this.floodAreas && this.floodAreas.length > 0) {
      console.log('plotFloodAreaData2');
      this.floodAreas.forEach(floodArea => {
        this.drawRadius(floodArea.latitude, floodArea.longitude, 0.5, 0.3, 'red', 'red', floodArea.label);
      });
    }
  }

  plotRainAreaData(): void {
    console.log('plotRainAreaData1');
    if (this.rainAreas && this.rainAreas.rainfall.length > 0) {
      console.log('plotRainAreaData2');
      this.rainAreas.rainfall.forEach(rainArea => {
        this.drawRadius(rainArea.latitude, rainArea.longitude, 2, 0.3, 'none', 'blue', rainArea.label);
      });
    }
  }

  drawRadius(lat: number, lng: number, radiusInKm: number, opacity: number, bordercolor: string, colour: string, label?: string) {
    const radiusCircle = L.circle([lat, lng], {
      radius: radiusInKm * 1000,
      color: bordercolor,
      fillColor: colour,
      fillOpacity: opacity
    }).addTo(this.map);
    
    if(label) {
      radiusCircle.bindTooltip(label, {
        permanent: true, // Always show
        direction: 'center', // Puts it in the middle of the circle
        className: 'circle-label'
      });
    }
  }


  showSnackbar(message: string, duration?: number): void {
    this.snackbarMessage = message;
    this.snackbarVisible = true;

    if(duration) {
      setTimeout(() => {
        this.snackbarVisible = false;
      }, duration);
    }
  }

  hideSnackbar(): void {
    this.snackbarVisible = false;
  }

  //NOTE
  //lat lng conversion, interim, for backend give me x y converted to lat lng
  // console.log('39251.41,35342.7343' + this.convertToLatLng(39251.41,35342.7343));
  // console.log('39464.4992,35319.6825' + this.convertToLatLng(39464.4992,35319.6825));
  // console.log('39692.6527,35310.6109' + this.convertToLatLng(39692.6527,35310.6109));
  // console.log('39583.9006,35439.6773' + this.convertToLatLng(39583.9006,35439.6773));
  convertToLatLng(x: number, y: number): Promise<{ lat: number, lng: number }> {
    //https://www.onemap.gov.sg/api/common/convert/3414to4326?X=28983.788791079794&Y=33554.5098132845
    const url = `https://www.onemap.gov.sg/api/common/convert/3414to4326?X=${x}&Y=${y}`;
    
    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.token,  // API token for authorization
      }
    })
    .then(res => {
      console.log(res);
      let json = res.json();
      console.log(json); 
      return json;
    })
    .then(data => ({
      lat: parseFloat(data.LATITUDE),
      lng: parseFloat(data.LONGITUDE)
    }))
    .catch(error => {console.error('Error:', error); return null}); 
    
  }


}
