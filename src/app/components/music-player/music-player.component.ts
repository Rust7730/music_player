import { Component } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { Track } from '../../models/track.model';

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.css']
})
export class MusicPlayerComponent {
  // Estado del reproductor
  currentTrack: Track | null = null;
  isPlaying: boolean = false;
  
  // Estado de búsqueda
  searchQuery: string = '';
  searchResults: Track[] = [];
  isSearching: boolean = false;
  noResults: boolean = false;
  currentTrackIndex: number = -1;

  constructor(private spotifyService: SpotifyService) {
    // Configurar canción por defecto
    this.setDefaultTrack();
  }

  /**
   * Configura una canción de ejemplo por defecto
   */
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

  /**
   * Realiza la búsqueda de canciones
   */
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

  /**
   * Maneja el evento de Enter en el input de búsqueda
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchTracks();
    }
  }

  /**
   * Selecciona una canción de los resultados
   */
  selectTrack(track: Track, index: number): void {
    this.currentTrack = track;
    this.currentTrackIndex = index;
    this.isPlaying = true;
  }

  /**
   * Alterna entre reproducir y pausar
   */
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

  /**
   * Reproduce la canción anterior
   */
  playPrevious(): void {
    if (this.searchResults.length > 0 && this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    }
  }

  /**
   * Reproduce la siguiente canción
   */
  playNext(): void {
    if (this.searchResults.length > 0 && this.currentTrackIndex < this.searchResults.length - 1) {
      this.currentTrackIndex++;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    }
  }

  /**
   * Obtiene la imagen del álbum
   */
  getAlbumImage(): string {
    if (this.currentTrack && this.currentTrack.album.images.length > 0) {
      return this.currentTrack.album.images[0].url;
    }
    return 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=No+Image';
  }

  /**
   * Obtiene los nombres de los artistas
   */
  getArtistsNames(track: Track): string {
    // [SIM EXPERIMENT 7] Return artist names in uppercase for the experiment
    return track.artists.map(artist => artist.name.toUpperCase()).join(', ');
  }

  /**
   * Obtiene la miniatura del álbum para la lista
   */
  getTrackThumbnail(track: Track): string {
    if (track.album.images.length > 0) {
      // Usa la imagen más pequeña disponible
      return track.album.images[track.album.images.length - 1].url;
    }
    return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image';
  }
}
