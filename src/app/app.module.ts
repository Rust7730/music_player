// src/app/app.module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module'; 
import { CommonModule } from '@angular/common'; 

import { AppComponent } from './app.component';
import { MusicPlayerComponent, TimeFormatPipe } from './components/music-player/music-player.component';
import { SearchResultsComponent } from './components/search-results/search-results.component'; 
import { SpotifyService } from './services/spotify.service';


@NgModule({
  declarations: [
    AppComponent,
    MusicPlayerComponent,
    
    SearchResultsComponent, 
    TimeFormatPipe        
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
   
    AppRoutingModule,     
    CommonModule          
  ],
  providers: [SpotifyService],
  bootstrap: [AppComponent]
})
export class AppModule { }