import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../globals';

export interface Rating {
  ratingId: string;
  songId: string;
  userId: string;
  stars: number;
  timestamp: string | Date;
}

export interface CreateRatingRequest {
  songId: string;
  username: string | undefined;
  stars: number;
}

export interface GetRatingsResponse {
  message: string;
  ratings: Rating[];
  count: number;
  hasMore: boolean;
  lastKey?: string;
}

export interface CreateRatingResponse {
  message: string;
  rating: {
    ratingId: string;
    songId: string;
    username: string;
    starts: string;
    timestamp: string | Date;
  };
}

export interface IsRatedResponse {
  is_rated: boolean;
}

export interface GetRatingParams {
  limit?: number;
  lastKey?: string;
  songId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private readonly apiUrl = `${API_URL}rating`;

  constructor(private http: HttpClient) {}

  /**
   * Get all subscriptions with optional filtering and pagination
   */
  getRatings(params: GetRatingParams = {}): Observable<GetRatingsResponse> {
    let httpParams = new HttpParams();
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.lastKey) {
      httpParams = httpParams.set('lastKey', params.lastKey);
    }
    
    if (params.songId) {
      httpParams = httpParams.set('songId', params.songId);
    }

    return this.http.get<GetRatingsResponse>(this.apiUrl, { params: httpParams });
  }

  createRating(ratingData: CreateRatingRequest): Observable<CreateRatingResponse> {
    return this.http.post<CreateRatingResponse>(this.apiUrl, ratingData);
  }

  isRated(songId: any): Observable<IsRatedResponse> {
    return this.http.get<IsRatedResponse>(this.apiUrl + '/check', {
      params: { songId }
    });
  }
}