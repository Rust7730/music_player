export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: AlbumInfo; 
  preview_url: string | null;
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
  images?: SpotifyImage[]; }

export interface AlbumInfo {
  id: string;
  name: string;
  artists?: Artist[]; 
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
