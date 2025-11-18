
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { Track, Album, AlbumInfo, Artist } from '../../models/track.model';
import { Pipe, PipeTransform } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs'; 

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
  styleUrls: ['./music-player.component.css']
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
  // Estado del reproductor (sin cambios mayormente)
  currentTrack: Track | null = null;
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  progressPercentage: number = 0;
  private audio: HTMLAudioElement | null = null;

 
  searchQuery: string = '';
  searchResults: Track[] = []; 
  isSearching: boolean = false; 
  noResults: boolean = false;   
  currentTrackIndex: number = -1; 


  private queryParamsSub: Subscription | null = null; 

  constructor(
    private spotifyService: SpotifyService,
    private router: Router, 
    private route: ActivatedRoute 
  ) {
    // Inicializar audio 
    this.audio = new Audio();
    this.setupAudioListeners();
  }

  ngOnInit(): void {
    // Cargar playlist inicial 
    this.loadInitialMusic();

    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const trackId = params['trackId'];
      if (trackId && (!this.currentTrack || this.currentTrack.id !== trackId)) {
        console.log("Recibido trackId:", trackId); 
        const trackFromParams: Track = {
          id: trackId,
          name: params['trackName'] || 'Canción Desconocida',
          artists: params['artistName'] ? [{ id: 'artist-temp', name: params['artistName'] }] : [],
          album: {
            id: 'album-temp',
            name: 'Álbum Desconocido',
            images: params['albumImage'] ? [{ url: params['albumImage'], height: 300, width: 300 }] : []
          },
          preview_url: params['previewUrl'] === 'null' ? null : params['previewUrl'], // Manejar 'null' como string
          uri: params['uri'] || '' // Opcional
        };
        // Seleccionar y reproducir automáticamente.
        // Usamos -2 para indicar que NO pertenece al índice de 'searchResults'.
        this.selectTrack(trackFromParams, -2, true);
      }
    });
  }

  ngOnDestroy(): void { // <<< 7. Implementar OnDestroy
    if (this.audio) {
      this.audio.pause();
      this.removeAudioListeners();
      this.audio = null;
    }
    // Desuscribirse para evitar fugas de memoria
    this.queryParamsSub?.unsubscribe();
  }

  // --- loadInitialMusic, setupAudioListeners, removeAudioListeners, setDefaultTrack (SIN CAMBIOS, pero revisados) ---
   private loadInitialMusic(): void {
     this.isSearching = true; // Indicar carga inicial
     // Asegúrate que la query aquí busca tracks que tengan preview_url si es posible
     // O maneja bien el caso de tracks sin preview en la UI inicial
     const initialPlaylistQuery = 'album:habla tu espejo artist:"El Cuarteto de Nos"';
     this.spotifyService.search(initialPlaylistQuery).subscribe({
       next: (response) => {
         // Filtrar tracks que sí tengan preview_url para la playlist inicial si quieres
         // this.searchResults = (response.tracks?.items || []).filter(t => t.preview_url);
         this.searchResults = response.tracks?.items || []; // O mantener todos
         this.noResults = this.searchResults.length === 0;

         if (!this.noResults) {
           this.selectTrack(this.searchResults[0], 0, false); // Seleccionar sin reproducir
         } else {
           this.setDefaultTrack(); // Mostrar estado inicial si no hay resultados
         }
         this.isSearching = false; // Terminar carga inicial
       },
       error: (error) => {
         console.error('Error al cargar la música inicial:', error);
         this.isSearching = false;
         this.noResults = true;
         this.setDefaultTrack(); // Mostrar estado inicial en caso de error
       }
     });
   }

    private setupAudioListeners(): void {
      if (!this.audio) return;
      this.audio.ontimeupdate = () => {
        if (!this.audio) return;
        this.currentTime = this.audio.currentTime;
        this.progressPercentage = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
      };
      this.audio.onloadedmetadata = () => {
        if (this.audio) this.duration = this.audio.duration;
      };
      this.audio.onended = () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.progressPercentage = 0;
        // Opcional: Auto-play siguiente SI viene de la playlist inicial
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.searchResults.length - 1) {
             this.playNext();
        }
      };
      this.audio.onerror = (e) => {
        console.error("Error en el elemento de audio:", e);
        this.isPlaying = false;
        // Podrías mostrar un mensaje al usuario aquí
      };
    }

    private removeAudioListeners(): void {
        if (this.audio) {
          this.audio.ontimeupdate = null;
          this.audio.onloadedmetadata = null;
          this.audio.onended = null;
          this.audio.onerror = null;
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
         images: [{ url: 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Spotify+Player', height: 300, width: 300 }]
       },
       preview_url: null,
       uri: ''
     };
     this.isPlaying = false;
     this.currentTime = 0;
     this.duration = 0;
     this.progressPercentage = 0;
     this.currentTrackIndex = -1; // Importante: indicar que no hay pista seleccionada de la playlist
   }


  // --- Método searchTracks MODIFICADO ---
  searchTracks(): void { // <<< 8. Modificar searchTracks
    const query = this.searchQuery.trim();
    if (!query) {
      return; // No hacer nada si la búsqueda está vacía
    }
    console.log("Navegando a búsqueda con:", query); // Log para depuración
    // Navegar a la ruta de búsqueda '/search/:query'
    this.router.navigate(['/search', query]);
  }

  // --- onSearchKeyPress (sin cambios) ---
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchTracks();
    }
  }

  // --- Método selectTrack MODIFICADO ---
  selectTrack(track: Track, index: number, autoplay: boolean = true): void { // <<< 9. Modificar selectTrack
    // Si la pista es la misma, solo alterna la reproducción si es necesario
    if (this.currentTrack && this.currentTrack.id === track.id) {
        // Solo llamar a togglePlayPause si el estado deseado (autoplay) es diferente al actual
        if (this.isPlaying !== autoplay && track.preview_url) {
            this.togglePlayPause();
        }
        // Actualizar el índice si viene de la playlist principal (index >= 0)
        if (index >= 0) {
           this.currentTrackIndex = index;
        }
        return; // No recargar el audio
    }

    console.log("Seleccionando track:", track.name, "Índice:", index); // Log para depuración
    this.currentTrack = track;
    // Solo actualizamos currentTrackIndex si el índice >= 0 (viene de la playlist)
    this.currentTrackIndex = index >= 0 ? index : -1; // Resetear índice si viene de búsqueda (index < 0)

    // Resetear estado de reproducción
    this.currentTime = 0;
    this.duration = 0;
    this.progressPercentage = 0;

    // Pausar y limpiar audio anterior
    if (this.audio) {
      this.audio.pause();
      this.removeAudioListeners();
      this.audio.src = ''; // Detener carga anterior
      this.audio = null; // Liberar referencia anterior
    }

    // Cargar nuevo audio si hay preview_url
    if (track.preview_url) {
      this.audio = new Audio(track.preview_url); // Crear nueva instancia
      this.setupAudioListeners(); // Configurar listeners para el nuevo audio

      if (autoplay) {
        this.audio.play().then(() => {
          this.isPlaying = true;
          console.log("Reproducción iniciada para:", track.name); // Log
        }).catch((err) => {
          console.warn('No se pudo iniciar la reproducción automáticamente:', track.name, err);
          this.isPlaying = false;
        });
      } else {
        this.isPlaying = false; // Si no es autoplay, asegurarse que isPlaying es false
      }
    } else {
      // Si no hay preview_url
      console.warn('Esta canción no tiene URL de previsualización:', track.name);
      this.isPlaying = false;
      // Opcional: Asegurarse de que el track actual refleje que no hay preview
      this.currentTrack = { ...track, preview_url: null };
      // Limpiar duración y tiempo si no hay audio que cargar
      this.duration = 0;
      this.currentTime = 0;
      this.progressPercentage = 0;
    }
  }


  // --- togglePlayPause (revisado para manejar no preview_url) ---
   togglePlayPause(): void {
     if (!this.audio || !this.currentTrack?.preview_url) { // <<< Condición añadida
       console.log("No hay audio cargado o no hay URL de preview para reproducir/pausar.");
       return;
     }

     if (this.isPlaying) {
       this.audio.pause();
     } else {
       if (this.audio.ended) {
         this.audio.currentTime = 0; // Reiniciar si había terminado
       }
       this.audio.play().catch(err => {
         console.error("Error al intentar reproducir:", err);
         this.isPlaying = false; // Forzar estado a false en caso de error
       });
     }
     // Cambiar el estado DESPUÉS de intentar la acción
     // Si play() falla, el estado se corrige en el catch o por el listener de error
     this.isPlaying = !this.isPlaying;
   }

  // --- playPrevious y playNext (revisados para usar currentTrackIndex correctamente) ---
  playPrevious(): void { // <<< 10. Revisar playPrevious/Next
    // Solo funciona si estamos en la playlist inicial (index válido) y no es la primera
    if (this.searchResults.length > 0 && this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    } else {
        console.log("No hay pista anterior en la playlist actual.");
    }
  }

  playNext(): void { // <<< 10. Revisar playPrevious/Next
    // Solo funciona si estamos en la playlist inicial (índice válido) y no es la última
    if (this.searchResults.length > 0 && this.currentTrackIndex >= 0 && this.currentTrackIndex < this.searchResults.length - 1) {
      this.currentTrackIndex++;
      this.selectTrack(this.searchResults[this.currentTrackIndex], this.currentTrackIndex);
    } else {
       console.log("No hay pista siguiente en la playlist actual o no se está reproduciendo desde la playlist.");
    }
  }

getAlbumImage(): string {
   
    if (this.currentTrack && this.currentTrack.album && this.currentTrack.album.images && this.currentTrack.album.images.length > 0) {

      return this.currentTrack.album.images[0].url;
    }
    return 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Spotify+Player';
  }

   getArtistsNames(item: { artists?: Artist[] }): string {
     if (!item || !item.artists) return '';
     return item.artists.map(artist => artist.name).join(', ');
   }


   getTrackThumbnail(track: Track): string {
     if (track.album?.images?.length > 0) {
       // Devolver la imagen más pequeña (última en el array usualmente)
       return track.album.images[track.album.images.length - 1].url;
     }
     return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image';
   }
}