
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PlayerStateService } from '../../services/player-state.service';
import { Track, Artist } from '../../models/track.model'; // Asegúrate que Artist esté exportado
import { Observable, Subscription } from 'rxjs';
import { TimeFormatPipe } from '../music-player/music-player.component'; // Importa el pipe
import { CommonModule } from '@angular/common'; // Importa CommonModule


@Component({
  selector: 'app-player-view',
  templateUrl: './player-view.component.html',
  styleUrls: ['./player-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
 
})
export class PlayerViewComponent implements OnInit, OnDestroy {
  // Observables directamente desde el servicio
  currentTrack$: Observable<Track | null>;
  isPlaying$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;

  // Propiedad local para el porcentaje
  progressPercentage: number = 0;
  private progressSub: Subscription | null = null;
   private trackSub: Subscription | null = null; // Para manejar default/placeholder


   // Para mostrar placeholder si no hay track
   currentTrack: Track | null = null;
   defaultImageUrl = 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Spotify+Player';


  constructor(
    public playerState: PlayerStateService, // Hacerlo público para usar en template (o crear getters)
    private cdRef: ChangeDetectorRef // Inyectar ChangeDetectorRef
    ) {
    this.currentTrack$ = this.playerState.currentTrack$;
    this.isPlaying$ = this.playerState.isPlaying$;
    this.currentTime$ = this.playerState.currentTime$;
    this.duration$ = this.playerState.duration$;
  }

  ngOnInit(): void {
     // Suscripción para calcular el porcentaje
     this.progressSub = this.playerState.currentTime$.subscribe(time => {
       const duration = this.playerState.getCurrentTrack()?.preview_url ? (this.playerState as any)._duration.value : 0; // Acceso un poco hacky o añadir getter en servicio
       this.progressPercentage = duration > 0 ? (time / duration) * 100 : 0;
       this.cdRef.markForCheck(); // Marcar para detección de cambios
     });


      // Suscripción para actualizar la propiedad local currentTrack
      this.trackSub = this.currentTrack$.subscribe(track => {
          this.currentTrack = track; // Mantener una copia local para el placeholder
          this.cdRef.markForCheck(); // Marcar para detección de cambios
      });
  }

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
     this.trackSub?.unsubscribe();
  }

  // --- Métodos que llaman al servicio ---
  togglePlayPause(): void {
    this.playerState.togglePlayPause();
  }

  // NOTA: Prev/Next ahora deberían ser manejados por MusicPlayerComponent
  //       o pasados a través del servicio si la lógica de playlist se mueve allí.
  //       Por ahora, los quitamos de esta vista.
  // playPrevious(): void { /* Lógica movida */ }
  // playNext(): void { /* Lógica movida */ }


  // --- Helpers para el template (pueden ser pipes o mantenerse aquí) ---
   getAlbumImage(): string {
     const track = this.currentTrack; // Usar la propiedad local
     if (track && track.album && track.album.images && track.album.images.length > 0) {
       return track.album.images[0].url;
     }
     return this.defaultImageUrl;
   }

   getArtistsNames(item: { artists?: Artist[] } | null | undefined): string {
     if (!item || !item.artists) return 'Artista desconocido';
     return item.artists.map(artist => artist.name).join(', ') || 'Artista desconocido';
   }

   // Método para manejar clic en barra de progreso (opcional)
   seek(event: MouseEvent): void {
     const progressBar = event.target as HTMLElement;
     const boundingRect = progressBar.getBoundingClientRect();
     const clickPosition = event.clientX - boundingRect.left;
     const percentage = clickPosition / boundingRect.width;
     const duration = (this.playerState as any)._duration.value; // Acceso hacky o getter
     if (duration > 0) {
       this.playerState.seek(duration * percentage);
     }
   }


}