import { Component, OnInit, OnDestroy } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { Track, Album, AlbumInfo, Artist } from '../../models/track.model';
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
  
  isShowingSearchResults: boolean = false;
  searchPageResults: Track[] = []; 
  topSearchResult: Track | null = null; 
  searchPageAlbums: AlbumInfo[] = []; 
  searchPageArtists: Artist[] = [];

  searchQuery: string = '';
  searchResults: Track[] = [];
  isSearching: boolean = false;
  noResults: boolean = false;
  currentTrackIndex: number = -1;

  private initialSearchTerm: string = 'El Cuarteto de Nos';

  constructor(private spotifyService: SpotifyService) {
    this.audio = new Audio();
    this.setupAudioListeners();
  }

  ngOnInit(): void {
    this.loadInitialMusic()
  }

  private loadInitialMusic(): void {
    const initialPlaylistQuery = 'album:habla tu espejo artist:"El Cuarteto de Nos"';
    this.spotifyService.search(initialPlaylistQuery).subscribe({next: (response) => {
        this.searchResults = response.tracks.items;
        this.noResults = this.searchResults.length === 0;

        if (!this.noResults) {
          this.selectTrack(this.searchResults[0], 0, false);
        } else {
          this.setDefaultTrack();
        }
        
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error al cargar la música inicial:', error);
        this.isSearching = false;
        this.noResults = true;
        this.setDefaultTrack(); 
      }
    });
  }

  ngOnDestroy(): void {
    if (this.audio) {
      try { this.audio.pause(); } catch (e) {  }
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

      this.audio.ontimeupdate = null;
      this.audio.onloadedmetadata = null;
      this.audio.onended = null;
    }
  }

  searchTracks(): void {
    if (!this.searchQuery.trim()) {
      this.isShowingSearchResults = false; 
      return;
    }

    this.isSearching = true;
    this.noResults = false;
    this.isShowingSearchResults = true; 
    
    this.spotifyService.search(this.searchQuery).subscribe({
      next: (response) => {
        const tracks = response.tracks.items;
        const albums = response.albums.items;
        const artists = response.artists.items;

        this.noResults = tracks.length === 0 && albums.length === 0 && artists.length === 0;

        if (!this.noResults) {
          this.searchPageResults = tracks.slice(1, 5); 
          this.searchPageAlbums = albums.slice(0, 5);
          this.searchPageArtists = artists.slice(0, 5);
        } else {
          this.topSearchResult = null;
          this.searchPageResults = [];
          this.searchPageAlbums = [];
          this.searchPageArtists = [];
        }

        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error al buscar canciones:', error);
        this.isSearching = false;
        this.noResults = true;
      }
    });
  }

  
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchTracks();
    }
  }

  public showPlayerView(): void {
    this.isShowingSearchResults = false;
  }

  selectTrack(track: Track, index: number, autoplay: boolean = true): void {
    if (this.isShowingSearchResults) {
      this.isShowingSearchResults = false;
    }

    this.currentTrack = track;
    this.currentTrackIndex = index;
    this.currentTime = 0;
    this.duration = 0;
    this.progressPercentage = 0;
    if (this.audio) {
      this.audio.pause();
      this.removeAudioListeners();
      this.audio = null;
    }

    if (track.preview_url) {
      this.audio = new Audio(track.preview_url);
      this.setupAudioListeners(); 

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

  getArtistsNames(item: { artists?: Artist[] }): string {
    if (!item || !item.artists) {
      return '';
    }
    return item.artists.map(artist => artist.name).join(', ');
  }

  getTrackThumbnail(track: Track): string {
    if (track.album.images.length > 0) {
      return track.album.images[track.album.images.length - 1].url;
    }
    return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image';
  }
}
