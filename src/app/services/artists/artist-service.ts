import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../globals';

export interface Artist {
  artistId: string;
  name: string;
  biography: string;
  genres: string[];
  country?: string;
  formedYear?: number;
  members?: string[];
  imageUrl?: string;
  socialLinks?: any;
  metadata?: {
    totalSongs: number;
    totalAlbums: number;
    followers: number;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtistRequest {
  name: string;
  biography: string;
  genres: string[];
}

export interface GetArtistsResponse {
  message: string;
  artists: Artist[];
  count: number;
  hasMore: boolean;
  lastKey?: string;
}

export interface CreateArtistResponse {
  message: string;
  artist: {
    artistId: string;
    name: string;
    biography: string;
    genres: string[];
  };
}

export interface GetArtistsParams {
  limit?: number;
  lastKey?: string;
  genre?: string;
  artistId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private readonly apiUrl = `${API_URL}/artists`;

  constructor(private http: HttpClient) {}

  /**
   * Get all artists with optional filtering and pagination
   */
  getArtists(params: GetArtistsParams = {}): Observable<GetArtistsResponse> {
    let httpParams = new HttpParams();
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.lastKey) {
      httpParams = httpParams.set('lastKey', params.lastKey);
    }
    
    if (params.genre) {
      httpParams = httpParams.set('genre', params.genre);
    }

    if(params.artistId) {
      httpParams = httpParams.set('artistId', params.artistId)
    }

    return this.http.get<GetArtistsResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Create a new artist
   */
  createArtist(artistData: CreateArtistRequest): Observable<CreateArtistResponse> {
    return this.http.post<CreateArtistResponse>(this.apiUrl, artistData);
  }

  /**
   * Get artist by ID
   */
  getArtistById(artistId: string): Observable<Artist> {
    return this.http.get<Artist>(`${this.apiUrl}/${artistId}`);
  }

  /**
   * Update artist
   */
  updateArtist(artistId: string, artistData: Partial<CreateArtistRequest>): Observable<Artist> {
    return this.http.put<Artist>(`${this.apiUrl}/${artistId}`, artistData);
  }

  /**
   * Delete artist
   */
  deleteArtist(artistId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${artistId}`);
  }
}