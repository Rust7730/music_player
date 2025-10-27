import { Component } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { Track } from '../../models/track.model';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class TimeFormatPipe implements PipeTransform {
  transform(seconds: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
  }
}

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.css'],
  providers: [TimeFormatPipe]
})
export class MusicPlayerComponent {
  // Estado del reproductor
  currentTrack: Track | null = null;
  isPlaying: boolean = false;
  
  // Variables para el tiempo y progreso
  currentTime: number = 0;
  duration: number = 0;
  progressPercentage: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  
  // Estado de búsqueda
  searchQuery: string = '';
  searchResults: Track[] = [];
  isSearching: boolean = false;
  noResults: boolean = false;
  currentTrackIndex: number = -1;

  constructor(private spotifyService: SpotifyService) {
    // Configurar canción por defecto
    this.setDefaultTrack();
      // Inicializar audio element
      this.audioElement = new Audio();
      this.setupAudioListeners();
  }

    private setupAudioListeners(): void {
      if (this.audioElement) {
        this.audioElement.ontimeupdate = () => {
          if (this.audioElement) {
            this.currentTime = this.audioElement.currentTime;
            this.progressPercentage = (this.currentTime / this.duration) * 100;
          }
        };
      
        this.audioElement.onloadedmetadata = () => {
          if (this.audioElement) {
            this.duration = this.audioElement.duration;
          }
        };

        this.audioElement.onended = () => {
          this.isPlaying = false;
          this.currentTime = 0;
          this.progressPercentage = 0;
        };
      }
    }
 
  private setDefaultTrack(): void {
    this.currentTrack = {
      id: 'default',
      name: 'Busca tu canción favorita',
      artists: [{ id: '1', name: 'Usa la barra de búsqueda' }],
      album: {
        id: '1',
        name: 'Default Album',
        images: [
          {
            url: 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Spotify+Player',
            height: 300,
            width: 300
          }
        ]
      },
      preview_url: null,
      uri: ''
    };
  }

  searchTracks(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching = true;
    this.noResults = false;
    
    this.spotifyService.searchTracks(this.searchQuery).subscribe({
      next: (response) => {
        this.searchResults = response.tracks.items;
        this.noResults = this.searchResults.length === 0;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error al buscar canciones:', error);
        this.isSearching = false;
        this.noResults = true;
        this.searchResults = [];
      }
    });
  }

  
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchTracks();
    }
  }

  selectTrack(track: Track, index: number): void {
    this.currentTrack = track;
    this.currentTrackIndex = index;
    this.isPlaying = true;
  }

  togglePlayPause(): void {
    if (this.currentTrack) {
      // [SIM EXPERIMENT 1] Log and apply alternative toggle behaviour for testing
      console.log('[SIM] togglePlayPause called - experiment 1');
      // Simulated behaviour: explicitly set play when currently stopped, otherwise pause
      if (!this.isPlaying) {
        this.isPlaying = true;
      } else {
        this.isPlaying = false;
      }
    }
  }

  playPrevious(): void {
    if (this.searchResults.length > 0 && this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    }
  }

 
  playNext(): void {
    if (this.searchResults.length > 0 && this.currentTrackIndex < this.searchResults.length - 1) {
      this.currentTrackIndex++;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    }
  }

  getAlbumImage(): string {
    if (this.currentTrack && this.currentTrack.album.images.length > 0) {
      return this.currentTrack.album.images[0].url;
    }
    return 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=No+Image';
  }

  getArtistsNames(track: Track): string {
    // [SIM EXPERIMENT 7] Return artist names in uppercase for the experiment
    return track.artists.map(artist => artist.name.toUpperCase()).join(', ');
  }

  getTrackThumbnail(track: Track): string {
    if (track.album.images.length > 0) {
      // Usa la imagen más pequeña disponible
      return track.album.images[track.album.images.length - 1].url;
    }
    return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image';
  }
}
