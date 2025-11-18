// src/app/services/player-state.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Track } from '../models/track.model';

@Injectable({
  providedIn: 'root' // Disponible globalmente
})
export class PlayerStateService implements OnDestroy {
  // Subjects privados para emitir valores
  private readonly _currentTrack = new BehaviorSubject<Track | null>(null);
  private readonly _isPlaying = new BehaviorSubject<boolean>(false);
  private readonly _currentTime = new BehaviorSubject<number>(0);
  private readonly _duration = new BehaviorSubject<number>(0);

  // Observables públicos para que los componentes se suscriban
  readonly currentTrack$: Observable<Track | null> = this._currentTrack.asObservable();
  readonly isPlaying$: Observable<boolean> = this._isPlaying.asObservable();
  readonly currentTime$: Observable<number> = this._currentTime.asObservable();
  readonly duration$: Observable<number> = this._duration.asObservable();

  private audio: HTMLAudioElement | null = null;
  private destroy$ = new Subject<void>(); 

  constructor() {
    console.log("PlayerStateService initialized");
  }

  ngOnDestroy(): void {
    console.log("PlayerStateService destroying");
    this.cleanupAudio();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método principal para cargar y reproducir una pista
  playTrack(track: Track | null, autoplay: boolean = true): void {
    if (!track) {
      this.stop(); // Si se pasa null, detener todo
      return;
    }

    // Si es la misma pista, solo manejar autoplay
    if (this.audio && this._currentTrack.value?.id === track.id) {
        if (autoplay && !this._isPlaying.value) {
            this.play();
        } else if (!autoplay && this._isPlaying.value) {
            this.pause();
        }
      
        this._currentTrack.next(track);
        return;
    }


    console.log("PlayerStateService: PlayTrack - ", track.name);
    this.cleanupAudio(); // Limpiar el audio anterior

    this._currentTrack.next(track);
    this._currentTime.next(0);    
    this._duration.next(0);       
    this._isPlaying.next(false);    

    if (track.preview_url) {
      this.audio = new Audio(track.preview_url);
      this.setupAudioListeners();

      if (autoplay) {
        this.play(); // Llama al método play interno
      }
    } else {
      console.warn('PlayerStateService: La pista no tiene preview_url:', track.name);
      // No hay audio que reproducir, el estado ya está reseteado
    }
  }

  togglePlayPause(): void {
    if (this._isPlaying.value) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    if (this.audio && this.audio.src) { // Asegurarse que hay audio cargado
      this.audio.play()
        .then(() => {
          this._isPlaying.next(true);
          console.log("PlayerStateService: Playing");
        })
        .catch(err => {
          console.error("PlayerStateService: Error al reproducir", err);
          this._isPlaying.next(false); // Asegurar estado correcto en error
        });
    } else {
        console.log("PlayerStateService: No hay audio para reproducir.");
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this._isPlaying.next(false);
      console.log("PlayerStateService: Paused");
    }
  }

  stop(): void {
      console.log("PlayerStateService: Stopping");
      this.cleanupAudio();
      this._currentTrack.next(null);
      this._isPlaying.next(false);
      this._currentTime.next(0);
      this._duration.next(0);
  }


  seek(time: number): void {
    if (this.audio && isFinite(time)) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    }
  }

  // --- Métodos privados ---
  private setupAudioListeners(): void {
    if (!this.audio) return;

    this.audio.ontimeupdate = () => {
      if (this.audio) this._currentTime.next(this.audio.currentTime);
    };

    this.audio.onloadedmetadata = () => {
      if (this.audio) this._duration.next(this.audio.duration);
    };

    this.audio.onended = () => {
      console.log("PlayerStateService: Audio ended");
      this._isPlaying.next(false);
      this._currentTime.next(0); // Opcional: reiniciar tiempo
      // Aquí podrías emitir un evento 'trackEnded' si necesitas auto-play
    };

    this.audio.onerror = (e) => {
      console.error("PlayerStateService: Error en Audio Element:", e);
      this._isPlaying.next(false); // Forzar estado a false
      // Podrías emitir un evento de error
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

  private cleanupAudio(): void {
    if (this.audio) {
      console.log("PlayerStateService: Cleaning up previous audio");
      this.audio.pause();
      this.removeAudioListeners();
      this.audio.src = ''; // Importante para detener descargas/buffered
      this.audio = null;
    }
  }

    // --- Helpers para obtener valores actuales (si son necesarios fuera de observables) ---
    getCurrentTrack(): Track | null {
        return this._currentTrack.value;
    }
    getIsPlaying(): boolean {
        return this._isPlaying.value;
    }

}