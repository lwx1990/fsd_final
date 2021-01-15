import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login.component';
import { MainComponent } from './components/main.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { HttpClientModule, HttpClientJsonpModule  } from '@angular/common/http';
import { MapsComponent } from './components/maps.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { RegisterComponent } from './components/register.component';
import { MapService } from './map.service';

//start lottie animation
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';

export function playerFactory() {
  return player;
}
//end lottie animation



const ROUTES: Routes = [
  {path: '', component: MainComponent},
  {path: 'login', component: LoginComponent},
  {path:'register', component: RegisterComponent},
  {path:'map', component: MapsComponent},
  {path: '**', redirectTo: '/', pathMatch: 'full'}
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    MapsComponent,
    RegisterComponent
    
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(ROUTES),
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    GoogleMapsModule,
    HttpClientJsonpModule,
    LottieModule.forRoot({player: playerFactory})
  ],
  providers: [AuthService, MapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
