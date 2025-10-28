export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: AlbumInfo; // Una canción contiene información básica del álbum
  preview_url: string | null;
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
  images?: SpotifyImage[]; // Los artistas en la búsqueda tienen imágenes
}

// Esta interfaz representa la información básica de un álbum,
// que es lo que viene dentro de un objeto Track.
export interface AlbumInfo {
  id: string;
  name: string;
  artists?: Artist[]; // Los álbumes en la búsqueda tienen artistas
  images: SpotifyImage[];
}

export interface Album {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: Artist[];
  tracks: {
    items: Track[];
  };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifySearchResponse {
  tracks: {
    items: Track[];
  };
  albums: {
    items: AlbumInfo[];
  };
  artists: {
    items: Artist[];
  };
}
