import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../globals';

// Interfaces
export interface Genre {
  genre: string;
  contentCount: number;
  artistCount: number;
  albumCount: number;
  totalItems: number;
}

export interface GenreResponse {
  message: string;
  genres: Genre[];
  count: number;
}

export interface Artist {
  artistId: string;
  name: string;
  biography?: string;
  primaryGenre: string;
  genres: string[];
  country?: string;
  formedYear?: number;
  imageUrl?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtistResponse {
  message: string;
  artists: Artist[];
  count: number;
  filters: {
    genre: string;
  };
  hasMore: boolean;
  lastKey?: string;
}

export interface Album {
  albumId: string;
  title: string;
  artistId: string;
  genre: string;
  description?: string;
  releaseYear?: number;
  trackCount: number;
  duration: number;
  coverImageUrl?: string;
  metadata?: any;
  recordLabel?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AlbumResponse {
  message: string;
  albums: Album[];
  count: number;
  filters: {
    genre: string;
    sortBy: string;
  };
  hasMore: boolean;
  lastKey?: string;
}

export interface FeedResponse{
  content: Album[];
  count: number;
}

export interface MusicContent {
  contentId: string;
  title: string;
  artistId: string;
  genre: string;
  album?: string;
  albumId?: string;
  trackNumber: number;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  lastModified?: string;
  coverImageUrl?: string;
  artistName?: string;  // Added for display
  streamURL?: string;   // Added for playback
}

export interface ContentResponse {
  message: string;
  content: MusicContent[];
  count: number;
  filters: {
    genre?: string;
    artistId?: string;
    albumId?: string;
    sortBy: string;
  };
  hasMore: boolean;
  lastKey?: string;
}

export interface DiscoverFilters {
  genre?: string;
  artistId?: string;
  albumId?: string;
  sortBy?: 'newest' | 'oldest';
  limit?: number;
  lastKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscoverService {
  private readonly API_BASE = `${API_URL}discover`;
  private readonly MUSIC_BASE = `${API_URL}music-content`;

  constructor(private http: HttpClient) {}

  /**
   * Get all available genres with counts
   */
  getGenres(): Observable<GenreResponse> {
    return this.http.get<GenreResponse>(`${this.API_BASE}/genres`);
  }

  /**
   * Get artists by genre with optional pagination
   */
  getArtistsByGenre(genre: string, limit: number = 20, lastKey?: string): Observable<ArtistResponse> {
    let params = new HttpParams()
      .set('genre', genre)
      .set('limit', limit.toString());

    if (lastKey) {
      params = params.set('lastKey', lastKey);
    }

    return this.http.get<ArtistResponse>(`${this.API_BASE}/artists`, { params });
  }

  /**
   * Get albums by genre with optional pagination and sorting
   */
  getAlbumsByGenre(
    genre: string, 
    sortBy: 'newest' | 'oldest' = 'newest',
    limit: number = 20, 
    lastKey?: string
  ): Observable<AlbumResponse> {
    let params = new HttpParams()
      .set('genre', genre)
      .set('sortBy', sortBy)
      .set('limit', limit.toString());

    if (lastKey) {
      params = params.set('lastKey', lastKey);
    }

    return this.http.get<AlbumResponse>(`${this.API_BASE}/albums`, { params });
  }
  
  getFeed(): Observable<FeedResponse> {
    return this.http.get<FeedResponse>(`${this.MUSIC_BASE}/feed`);
  }

  /**
   * Get content with flexible filtering
   */
  getContent(filters: DiscoverFilters): Observable<ContentResponse> {
    let params = new HttpParams();

    if (filters.genre) {
      params = params.set('genre', filters.genre);
    }
    if (filters.artistId) {
      params = params.set('artistId', filters.artistId);
    }
    if (filters.albumId) {
      params = params.set('albumId', filters.albumId);
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.lastKey) {
      params = params.set('lastKey', filters.lastKey);
    }

    return this.http.get<ContentResponse>(`${this.API_BASE}/content`, { params });
  }

  /**
   * Get content by genre only
   */
  getContentByGenre(
    genre: string,
    sortBy: 'newest' | 'oldest' = 'newest',
    limit: number = 20,
    lastKey?: string
  ): Observable<ContentResponse> {
    return this.getContent({
      genre,
      sortBy,
      limit,
      lastKey
    });
  }

  /**
   * Get content by genre and artist
   */
  getContentByArtist(
    genre: string,
    artistId: string,
    sortBy: 'newest' | 'oldest' = 'newest',
    limit: number = 20,
    lastKey?: string
  ): Observable<ContentResponse> {
    return this.getContent({
      genre,
      artistId,
      sortBy,
      limit,
      lastKey
    });
  }

  /**
   * Get content by album (tracks in album)
   */
  getContentByAlbum(
    albumId: string,
    limit: number = 50,
    lastKey?: string
  ): Observable<ContentResponse> {
    return this.getContent({
      albumId,
      sortBy: 'newest', // Will be overridden to track_order in backend
      limit,
      lastKey
    });
  }
}