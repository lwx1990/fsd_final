import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MapService } from '../map.service';



@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {

  apiLoaded: Observable<boolean>;

  consumer: []

  constructor(private http: HttpClient,  private mapSvc: MapService) {
      this.apiLoaded =  this.http.jsonp(`https://maps.googleapis.com/maps/api/js?key=Your_api_key`, 'callback')
      .pipe(map(() => true),
      catchError(() => of(false)),
    );
  }

  center: google.maps.LatLngLiteral = {lat: 1.3521, lng: 103.8198};
  markerPositions: google.maps.LatLngLiteral 
  markerOptions: google.maps.MarkerOptions = {draggable: false}
  zoom = 11;
  
  ngOnInit(): void {

    this.mapSvc.getLocation()
          .then(resp => {        
              console.log(resp['user_locations'])
              this.markerPositions = resp['user_locations']
              
          }).catch(e=> console.error('error:', e))
    
    this.mapSvc.getUser()
            .then(result => {
              this.consumer = result
              console.log(result)
            })
            .catch(e => {
              console.log(e)
            })
    
  } 

}
