import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { Track, AlbumInfo, Artist } from '../../models/track.model';
import { SpotifySearchResponse } from '../../models/track.model'; // Asegúrate que esta interfaz esté exportada o definida aquí
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'] 
  

})
export class SearchResultsComponent implements OnInit {
  query: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  noResults: boolean = false;

  topSearchResult: Track | null = null;
  searchPageResults: Track[] = [];
  searchPageAlbums: AlbumInfo[] = [];
  searchPageArtists: Artist[] = [];

  private routeSub: Subscription | null = null;
  private searchSub: Subscription | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService,
    private playerState: PlayerStateService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.query = params.get('query') || '';
      if (this.query) {
        this.search();
      } else {
         this.router.navigate(['/']);
      }
    });
  }

   ngOnDestroy(): void {
     this.routeSub?.unsubscribe();
     this.searchSub?.unsubscribe();
   }


  search(): void {
    if (!this.query.trim()) return;

    this.isLoading = true;
    this.error = null;
    this.noResults = false;
    this.resetResults(); 



     this.searchSub?.unsubscribe();


    this.searchSub = this.spotifyService.search(this.query).subscribe({
      next: (response: SpotifySearchResponse) => {
        const tracks = response.tracks?.items || [];
        const albums = response.albums?.items || [];
        const artists = response.artists?.items || [];

        this.noResults = tracks.length === 0 && albums.length === 0 && artists.length === 0;

        if (!this.noResults) {
          this.topSearchResult = tracks.length > 0 ? tracks[0] : null; 
          this.searchPageResults = tracks.slice(1, 5); 
          this.searchPageAlbums = albums.slice(0, 5);
          this.searchPageArtists = artists.slice(0, 5);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al buscar:', err);
        this.error = 'Ocurrió un error al buscar. Inténtalo de nuevo.';
        this.isLoading = false;
        this.noResults = true;
        this.resetResults();
      }
    });
  }

  
  private resetResults(): void {
      this.topSearchResult = null;
      this.searchPageResults = [];
      this.searchPageAlbums = [];
      this.searchPageArtists = [];
  }


 
  getArtistsNames(item: { artists?: Artist[] }): string {
    if (!item || !item.artists) return '';
    return item.artists.map(artist => artist.name).join(', ');
  }

  getTrackThumbnail(track: Track): string {
     if (track.album?.images?.length > 0) {
       // Usar la imagen más pequeña para miniaturas
       return track.album.images[track.album.images.length - 1].url;
     }
     return 'https://via.placeholder.com/64x64/1DB954/FFFFFF?text=No+Image'; // Placeholder
  }

   getAlbumImage(album: AlbumInfo): string {
     if (album.images?.length > 0) {
       return album.images[0].url; 
     }
     return 'https://via.placeholder.com/160x160/1DB954/FFFFFF?text=No+Image'; // Placeholder
   }

   getArtistImage(artist: Artist): string {
     if (artist.images && artist.images.length > 0) {
          return artist.images[0].url;
     }
     return 'https://via.placeholder.com/160x160/1DB954/FFFFFF?text=Artist'; // Placeholder
   }


   // --- Navegación ---
    selectTrackAndPlay(track: Track): void {
      
      this.router.navigate(['/'], {  });
   }
    
    private getTrackAlbumImage(track: Track): string {
      if (track.album && track.album.images.length > 0) {
        return track.album.images[0].url; 
      }
      return 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=No+Image'; // O un placeholder
    }


   goHome(): void {
       this.router.navigate(['/']); 
   }


}