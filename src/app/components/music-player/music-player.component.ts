import { Component, OnInit, OnDestroy } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { Track, Album } from '../../models/track.model';
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
export class MusicPlayerComponent implements OnInit, OnDestroy {
  // Estado del reproductor
  currentTrack: Track | null = null;
  isPlaying: boolean = false;
  
  
  currentTime: number = 0;
  duration: number = 0;
  progressPercentage: number = 0;
  private audio: HTMLAudioElement | null = null;
  
  // Estado de búsqueda
  searchQuery: string = '';
  searchResults: Track[] = [];
  isSearching: boolean = false;
  noResults: boolean = false;
  currentTrackIndex: number = -1;

  private initialSearchTerm: string = 'El Cuarteto de Nos';

  constructor(private spotifyService: SpotifyService) {
    // El contenido se mueve a ngOnInit para asegurar que el componente esté listo
    this.audio = new Audio();
    this.setupAudioListeners();
  }

  ngOnInit(): void {
    // Al iniciar el componente, cargamos el álbum por defecto.
  
    this.loadInitialMusic()
  }
  private loadInitialMusic(): void {
    this.searchQuery = this.initialSearchTerm;
    this.isSearching = true; // Muestra el spinner de carga
    this.spotifyService.searchTracks(this.searchQuery).subscribe({next: (response) => {
        // 3. Asigna los resultados a la lista de la derecha
        this.searchResults = response.tracks.items;
        this.noResults = this.searchResults.length === 0;

        // 4. Si se encontraron resultados...
        if (!this.noResults) {
          // ...selecciona la primera canción (índice 0)
          this.selectTrack(this.searchResults[0], 0);
          
          // ...y asegúrate de que no se reproduzca automáticamente.
          // Esto hará que se vea seleccionada (verde) pero pausada.
          this.isPlaying = false; 
        } else {
          // Si no hay resultados, carga el placeholder
          this.setDefaultTrack();
        }
        
        this.isSearching = false; // Oculta el spinner
      },
      error: (error) => {
        console.error('Error al cargar la música inicial:', error);
        this.isSearching = false;
        this.noResults = true;
        this.setDefaultTrack(); // Muestra el placeholder si hay un error
      }
    });
  }

  ngOnDestroy(): void {
    // Asegurarse de pausar y limpiar el audio al destruir el componente
    if (this.audio) {
      try { this.audio.pause(); } catch (e) { /* ignore */ }
      this.removeAudioListeners();
      this.audio = null;
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

  private setupAudioListeners(): void {
    if (this.audio) {
      this.audio.ontimeupdate = () => {
        if (!this.audio) return;
        this.currentTime = this.audio.currentTime;
        this.progressPercentage = (this.currentTime / this.duration) * 100;
      };
      this.audio.onloadedmetadata = () => {
        if (this.audio) this.duration = this.audio.duration;
      };
      this.audio.onended = () => {
          this.isPlaying = false;
          this.currentTime = 0;
          this.progressPercentage = 0;
        };
      }
    }
 
  private removeAudioListeners(): void {
    if (this.audio) {
      // Limpiamos los listeners para evitar fugas de memoria
      this.audio.ontimeupdate = null;
      this.audio.onloadedmetadata = null;
      this.audio.onended = null;
    }
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

  selectTrack(track: Track, index: number, autoplay: boolean = true): void {
    this.currentTrack = track;
    this.currentTrackIndex = index;
    this.currentTime = 0;
    this.duration = 0;
    this.progressPercentage = 0;
    // Limpiamos el audio anterior para evitar que dos canciones suenen a la vez
    if (this.audio) {
      this.audio.pause();
      this.removeAudioListeners();
      this.audio = null;
    }

    if (track.preview_url) {
      this.audio = new Audio(track.preview_url);
      this.setupAudioListeners(); // Configuramos los listeners para el nuevo audio

      if (autoplay) {
        this.audio.play().then(() => {
          this.isPlaying = true;
        }).catch((err) => {
          console.warn('No se pudo reproducir preview:', err);
          this.isPlaying = false;
        });
      } else {
        this.isPlaying = false;
      }
    } else {
      // Si la canción no tiene preview, nos aseguramos de que el estado sea 'pausado'
      this.isPlaying = false;
    }
  }

  togglePlayPause(): void {
    if (!this.currentTrack || !this.audio) {
      return;
    }

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      // Si el audio terminó, lo reiniciamos
      if (this.audio.ended) {
        this.audio.currentTime = 0;
      }
      this.audio.play().catch(err => {
        console.error("Error al intentar reproducir", err);
        this.isPlaying = false;
      });
    }
    this.isPlaying = !this.isPlaying;
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
    return track.artists.map(artist => artist.name).join(', ');
  }

  getTrackThumbnail(track: Track): string {
    if (track.album.images.length > 0) {
      // Usa la imagen más pequeña disponible
      return track.album.images[track.album.images.length - 1].url;
    }
    return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image';
  }
}
