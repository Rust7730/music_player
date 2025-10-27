
export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  preview_url: string | null;
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  name: string;
  images: Image[];
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

/**
 * Respuesta de la API de Spotify para búsqueda de canciones
 */
export interface SpotifySearchResponse {
  tracks: {
    items: Track[];
    total: number;
  };
}
