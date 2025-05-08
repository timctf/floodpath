import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { LatLng } from 'leaflet';
import { CarparkLocation, DirectionRequest, DirectionResponse, FloodArea, FloodProneArea, OneMapRouteResponse, RainArea, Telelocation } from './app.model';
import { AppService } from './app.service';
import { Observable, Subscription, interval, map, of, switchMap } from 'rxjs';
import * as polyline from '@mapbox/polyline';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy  {
  
  @ViewChild('promptBoxMarker') promptBoxMarker!: ElementRef;

  private token: string | null = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzOGQ1OTk1MzkzZTg0NWQ4NTcwMzI0MzIzNGMxZGQ1OSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTc0NjYyNzYxMSwiZXhwIjoxNzQ2ODg2ODExLCJuYmYiOjE3NDY2Mjc2MTEsImp0aSI6Im1XZ0k4YzVTcG9Od3BTeWMiLCJ1c2VyX2lkIjo2OTA1LCJmb3JldmVyIjpmYWxzZX0.yYmMHx_wf_ZdIaRoiORLwQQ3CeWyJUOGNTToO7hVj_g';

  private pollSub: Subscription;
  private pollLocation: Subscription;


  private map!: L.Map; // <-- Main map
  personIcon!: L.Icon; // <-- Person position icon
  carparkIcon!: L.Icon; // <-- Carpark position icon
  floodproneIcon!: L.Icon; // <-- Floodprone icon

  lightRainIcon!: L.Icon; // <-- Light rain icon
  moderateRainIcon!: L.Icon; // <-- Moderate rain icon
  heavyRainIcon!: L.Icon; // <-- Heavy rain icon
  intenseRainIcon!: L.Icon; // <-- Intense rain icon
  torrentialRainIcon!: L.Icon; // <-- Torrential rain icon

  private stillUpdating: boolean = false; 

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
  
  promptDetails: string[] = [];

  myRainArea: L.Circle | null = null;

  dropMode: boolean = false; // tracks if user is in "drop mode"
  
  snackbarMessage: string = '';
  snackbarVisible: boolean = false;

  loadingCarparks = true;
  loadingFloodProneAreas = true;
  loadingFloodAreas = false;
  loadingRainAreas = false;
  loadingIslandWideRainAreas = true;
  loadingRoute = false;

  carparks: CarparkLocation[] = [];
  floodProneAreas: FloodProneArea[] = [];
  floodAreas: FloodArea[] = [];
  rainAreas: RainArea = null;
  islandWideRainAreas: RainArea = null;

  private subscriptions: Subscription[] = [];
  constructor(
    private appService: AppService
  ) {}

  ngOnInit(): void {
      this.initIcons();
      this.initMap();
      this.loadCarParkData();
      this.loadFloodProneAreaData();
      this.getIslandWideRainAreaData();

      this.pollSub = interval(5000) // every 5 seconds
      .pipe(
        switchMap(() => this.appService.getFloodAreaData())
      )
      .subscribe((res) => {
        this.processFloodAreaData(res); // or append, filter, etc.
      });

      this.pollLocation = interval(2000) // every 2 seconds
      .pipe(
        switchMap(() => this.appService.getTelelocationData())
      )
      .subscribe((res) => {
        this.processTeleLocationData(res); // or append, filter, etc.
      });

  }

  ngOnDestroy(): void {
    // Loop and unsubscribe from all
    this.subscriptions.forEach(sub => sub.unsubscribe());

    if (this.pollSub) {
      this.pollSub.unsubscribe(); // clean up on component destroy
    }

    if (this.pollLocation) {
      this.pollLocation.unsubscribe(); // clean up on component destroy
    }

    
  }

  ngDoCheck(): void {
    if (
      this.lat !== null && this.lng !== null && this.stillUpdating === false &&
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

    this.calculateInfo(lat, lng);
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
      iconSize: [12, 12],
      iconAnchor: [6, 12],
      popupAnchor: [0, -12],
    });

    this.floodproneIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/18215/18215616.png',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Light Rain (☁️ Single raindrop)
    this.lightRainIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/15524/15524302.png',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    // Moderate Rain (🌦️ Two droplets)
    this.moderateRainIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/16943/16943402.png',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    // Heavy Rain (🌧️ Cloud + rain)
    this.heavyRainIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/12744/12744946.png',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    // Intense Rain (🌩️ Rain + lightning)
    this.intenseRainIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/4724/4724091.png',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    // Torrential Rain (⛈️ Flood/hazard)
    this.torrentialRainIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/1247/1247779.png',
      iconSize: [50, 50],
      iconAnchor: [50, 50]
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

  processFloodAreaData(res: FloodArea) {

    //make sure not duplicate
    if(res) {
      const exists = this.floodAreas.some(area =>
        area.latitude === res.latitude &&
        area.longitude === res.longitude &&
        area.label === res.label
      );
    
      if (!exists) {
        this.floodAreas.push(res);
        //Populate data
        this.plotFloodAreaData(res);
      }
    }

  }

  processTeleLocationData(res: Telelocation) {

    //make sure not duplicate
    if(res && res.latitude && res.longitude) {

      // Clear previous marker if it exists
      this.clearUserMarker();

      // Add a marker
      this.userMarker = L.marker([res.latitude, res.longitude], {icon: this.personIcon})
      .addTo(this.map)
      .bindPopup('You are here!');

      this.stillUpdating = true;
      this.lat = res.latitude;
      this.lng = res.longitude;
      this.stillUpdating = false;

    }

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
        this.myRainArea?.remove();

        //Populate data
        this.plotRainAreaData();
      })
    );
  }

  getIslandWideRainAreaData() {
    this.loadingIslandWideRainAreas = true;
    this.subscriptions.push(
      this.appService.getIslandWideRainAreaData().subscribe((res: any) => {
        let ra: RainArea = {
          latitude: res.fromLatitude,
          longitude: res.fromLongitude,
          rainfall: res.results
        }
        
        this.islandWideRainAreas = ra;
        this.loadingIslandWideRainAreas = false;
        
        //Populate data
        this.plotIslandRainAreaData();
      })
    );
  }

  dismissPrompt(): void {
    this.promptDetails = [];
  }

  calculateInfo(lat: number, lng: number) {
    this.promptDetails = [];
    console.log(lat, lng);
    if(lat && lng) {
      let inFloodProneZone: boolean = this.isPointInFloodProneZone(lat, lng, 0.2);
      let inFloodZone: boolean = this.isPointInFloodZone(lat, lng, 0.5);
      let inRainZone: boolean = this.isPointInRainZone(lat, lng, 2);

      console.log("inFloodProneZone: "+ inFloodProneZone);
      console.log("inFloodZone: "+ inFloodZone);
      console.log("inRainZone: "+ inRainZone);

      if(inFloodZone) {
        this.promptBoxMarker.nativeElement.classList.add('redClass');
        this.promptBoxMarker.nativeElement.classList.remove('orangeClass');
        this.promptBoxMarker.nativeElement.classList.remove('greenClass');
        this.promptDetails.push('You are currently in a flooded area. ');
        this.promptDetails.push('Please follow the directions to get to a multi story carpark immediately. ');
      } else if(inFloodProneZone && inRainZone) {
        this.promptBoxMarker.nativeElement.classList.add('redClass');
        this.promptBoxMarker.nativeElement.classList.remove('orangeClass');
        this.promptBoxMarker.nativeElement.classList.remove('greenClass');
        this.promptDetails.push('You are currently in a flood prone area and it is raining.');
        this.promptDetails.push('It is highly recommended to relocate your vehicle to the nearest multi story carpark. ');
      } else if(inFloodProneZone && !inRainZone) {
        this.promptBoxMarker.nativeElement.classList.add('orangeClass');
        this.promptBoxMarker.nativeElement.classList.remove('redClass');
        this.promptBoxMarker.nativeElement.classList.remove('greenClass');
        this.promptDetails.push('You are currently in a flood prone area, the weather seems good for now. ');
        this.promptDetails.push('Please monitor the weather conditions.  ');
        this.promptDetails.push('Feel free to follow the instructions if required. ');
      } else if(inRainZone) {
        this.promptBoxMarker.nativeElement.classList.add('greenClass');
        this.promptBoxMarker.nativeElement.classList.remove('redClass');
        this.promptBoxMarker.nativeElement.classList.remove('orangeClass');
        this.promptDetails.push('Rainfall detected in your area. ');
        this.promptDetails.push('Feel free to follow the instructions if required. ');
      } else {
        this.promptBoxMarker.nativeElement.classList.add('greenClass');
        this.promptBoxMarker.nativeElement.classList.remove('redClass');
        this.promptBoxMarker.nativeElement.classList.remove('orangeClass');
        this.promptDetails.push('You are not located in a flood risk zone and the weather seems great. ');
      }
      
    }
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
        this.drawFloodRadius(floodProneArea.latitude, floodProneArea.longitude, 0.2, 0.05, 'green', 'green', floodProneArea.label);
      });
    }
  }

  plotFloodAreaData(floodArea: FloodArea): void {
    console.log('plotFloodAreaData1');
    // if (this.floodAreas && this.floodAreas.length > 0) {
    //   console.log('plotFloodAreaData2');
    //   this.floodAreas.forEach(floodArea => {
    //     this.drawRadius(floodArea.latitude, floodArea.longitude, 0.5, 0.3, 'red', 'red', floodArea.label);
    //   });
    // }
    if(floodArea && floodArea.latitude && floodArea.longitude) {
      this.drawRadius(floodArea.latitude, floodArea.longitude, 0.5, 0.3, 'red', 'red', 'Flood detected @ ' + floodArea.label);
    }
  }

  plotRainAreaData(): void {
    console.log('plotRainAreaData1');
    if (this.rainAreas && this.rainAreas.rainfall?.length > 0) {
      console.log('plotRainAreaData2');
      this.rainAreas.rainfall.forEach(rainArea => {
        this.drawMyAreaRainfallRadius(rainArea.latitude, rainArea.longitude, 2, 0.2, 'none', 'blue', rainArea.label);
      });
    }
  }

  plotIslandRainAreaData(): void {
    console.log('plotIslandRainAreaData');
    if (this.islandWideRainAreas && this.islandWideRainAreas.rainfall.length > 0) {
      console.log('plotIslandRainAreaData');
      this.islandWideRainAreas.rainfall.forEach(rainArea => {
        this.drawRainfallRadius(rainArea.latitude, rainArea.longitude, 2, 0.2, 'none', '#4eaeff', rainArea.label);
      });
    }
  }

  drawFloodRadius(lat: number, lng: number, radiusInKm: number, opacity: number, bordercolor: string, colour: string, label?: string) {
    const radiusCircle = L.circle([lat, lng], {
      radius: radiusInKm * 1000,
      color: bordercolor,
      fillColor: colour,
      fillOpacity: opacity
    });
    
    const iconMarker = L.marker([lat, lng], { icon: this.floodproneIcon, title: 'Floodprone Area: '+label, opacity: 1 });

    // Group circle and icon together
    const circleGroup = L.layerGroup([radiusCircle, iconMarker]).addTo(this.map);
  }

  drawRainfallRadius(lat: number, lng: number, radiusInKm: number, opacity: number, bordercolor: string, colour: string, label?: string) {
    const radiusCircle = L.circle([lat, lng], {
      radius: radiusInKm * 1000,
      color: bordercolor,
      fillColor: colour,
      fillOpacity: opacity
    });
    
    const iconMarker = L.marker([lat, lng], { icon: this.getRainIcon(label), title: label, opacity: 1 });

    // Group circle and icon together
    const circleGroup = L.layerGroup([radiusCircle, iconMarker]).addTo(this.map);

  }

  drawMyAreaRainfallRadius(lat: number, lng: number, radiusInKm: number, opacity: number, bordercolor: string, colour: string, label?: string) {
    this.myRainArea = L.circle([lat, lng], {
      radius: radiusInKm * 1000,
      color: bordercolor,
      fillColor: colour,
      fillOpacity: opacity
    })
    
    this.myRainArea.addTo(this.map);
    
    if(label) {
      this.myRainArea.bindTooltip(label, {
        permanent: true, // Always show
        direction: 'center', // Puts it in the middle of the circle
        className: 'circle-label'
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

  getRainIcon(rainfall: string): L.Icon {
    console.log('@@@' + rainfall);
    if (rainfall === 'Light rain') return this.lightRainIcon;
    else if (rainfall === 'Moderate rain') return this.moderateRainIcon;
    else if (rainfall === 'Heavy rain') return this.heavyRainIcon;
    else if (rainfall === 'Intense Rain') return this.intenseRainIcon;
    else return this.torrentialRainIcon;
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

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
  
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  isPointInFloodProneZone(lat: number, lng: number, radiusKm: number): boolean {
    return this.floodProneAreas.some(area => {
      const distance = this.getDistanceFromLatLonInKm(lat, lng, area.latitude, area.longitude);
      return distance <= radiusKm;
    });
  }

  isPointInFloodZone(lat: number, lng: number, radiusKm: number): boolean {
    return this.floodAreas.some(area => {
      const distance = this.getDistanceFromLatLonInKm(lat, lng, area.latitude, area.longitude);
      return distance <= radiusKm;
    });
  }

  isPointInRainZone(lat: number, lng: number, radiusKm: number): boolean {
    if (this.islandWideRainAreas && this.islandWideRainAreas.rainfall?.length === 0) {
      return false;
    }
    return this.islandWideRainAreas.rainfall.some(rainfall => {
      const distance = this.getDistanceFromLatLonInKm(lat, lng, rainfall.latitude, rainfall.longitude);
      return distance <= radiusKm;
    });
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
