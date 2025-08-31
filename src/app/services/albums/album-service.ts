import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../globals';
import { Observable } from 'rxjs';

export interface Album {
  albumId: string;
  title: string;
  artistId: string;
  genre: string;
  tracksIds: string[];
}

export interface CreateAlbumRequest {
  title: string;
  artistId: string;
  genre: string;
  tracksIds: string[];
}

export interface CreateAlbumResponse {
  message: string;
  album: Album;
}

@Injectable({
  providedIn: 'root'
})

export class AlbumService {
  private readonly URL =  `${API_URL}/albums`;
  constructor(private http: HttpClient) { }

  createAlbum(request: CreateAlbumRequest): Observable<CreateAlbumResponse> {
    return this.http.post<CreateAlbumResponse>(this.URL, request);
  }
}
