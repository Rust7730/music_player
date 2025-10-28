import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of, tap, map } from 'rxjs';
import { SpotifySearchResponse, Album, Track } from '../models/track.model';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private readonly API_URL = 'https://api.spotify.com/v1';
  private readonly TOKEN_URL = 'https://accounts.spotify.com/api/token';
  
 
  private readonly CLIENT_ID = 'ee7edaea8da44bd0aa311338860662e0';
  private readonly CLIENT_SECRET = 'ac1f8f73bcfa42a8a9066f6429c588d2';
  
  
  private accessToken: string | null = null;
  private tokenExpirationTime: number = 0;

  constructor(private http: HttpClient) {}

  
  private getAccessToken(): Observable<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpirationTime > now) {
      return of(this.accessToken);
    }
    const credentials = btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`);
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = 'grant_type=client_credentials';

    return this.http.post<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>(this.TOKEN_URL, body, { headers }).pipe(
      tap(response => {
  
        this.accessToken = response.access_token;
    
        this.tokenExpirationTime = Date.now() + ((response.expires_in - 300) * 1000);
        console.log(' Token de Spotify obtenido correctamente');
      }),
      switchMap(response => of(response.access_token)),
      catchError(error => {
        console.error(' Error al obtener el token de Spotify:', error);
        console.error('Verifica que CLIENT_ID y CLIENT_SECRET sean correctos');
        throw error;
      })
    );
  }

  search(query: string): Observable<SpotifySearchResponse> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        const url = `${this.API_URL}/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=10`;
        
        return this.http.get<SpotifySearchResponse>(url, { headers });
      }),
      catchError(error => {
        console.error(' Error en la búsqueda de Spotify:', error);
        if (error.status === 401) {
          console.error('Token inválido o expirado. Verifica tus credenciales.');
          this.accessToken = null;
          this.tokenExpirationTime = 0;
        }
        throw error;
      })
    );
  }

  getAlbum(albumId: string): Observable<Album> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        const url = `${this.API_URL}/albums/${albumId}`;
        return this.http.get<Album>(url, { headers });
      }),
      map(album => {
        const albumInfoForTrack = {
          id: album.id,
          name: album.name,
          images: album.images
        };
        album.tracks.items = album.tracks.items.map(track => ({
          ...track,
          album: albumInfoForTrack
        }));
        return album;
      }),
      catchError(error => {
        console.error(` Error al obtener el álbum ${albumId}:`, error);
        throw error;
      })
    );
  }

  clearToken(): void {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    console.log('Token limpiado');
  }
}
