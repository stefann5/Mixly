import { Injectable } from '@angular/core';
import { API_URL } from '../../globals';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

export interface MusicContent {
  coverImageUrl: string;
  coverImageContentType: string;
  lastModified: string;
  createdAt: string;
  genre: string;
  artistId: string;
  artistName?: string;
  album: string;
  filename: string
  fileSize: number;
  contentId: string;
  fileType: string;
  title: string;
  streamURL: string;
}

export interface GetAllMusicContentResponse {
  content: MusicContent[];
  count: number;
}

export interface CreateMusicContentRequest {
  title: string;
  artistId: string;
  album?: string;
  genre?: string;
  audioFile: File;
  coverImage?: File;
}

export interface CreateMusicContentResponse {
  message: string;
  contentId: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface UpdateMusicContentMetadataRequest {
  contentId: string;
  title: string;
  album: string;
  genre: string;
}

export interface UpdateMusicContentFilesRequest {
  contentId: string;
  title: string;
  album: string;
  genre: string;
  audioFile?: File;
  coverImage?: File;
}

export interface UpdateMusicContentResponse {
  message: string;
  content: MusicContent;
  filesUpdated: string[];
}

export interface DeleteMusicContentResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MusicContentService {
  private readonly apiUrl = `${API_URL}/music-content`;
  constructor(private http: HttpClient) { }

  getAllMusicContent(): Observable<GetAllMusicContentResponse> {
    return this.http.get<GetAllMusicContentResponse>(this.apiUrl);
  }

  getMusicContentById(contentId: string): Observable<MusicContent> {
    const httpParams = new HttpParams().set('contentId', contentId);
    return this.http.get<MusicContent>(this.apiUrl, {params: httpParams});
  }

  createMusicContent(content: CreateMusicContentRequest): Observable<CreateMusicContentResponse> {
    const formData = new FormData();

    const metadata = {
      title: content.title,
      artistId: content.artistId,
      ...(content.album && {album: content.album}),
      ...(content.genre && {genre: content.genre})
    };
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('audioFile', content.audioFile);
    if(content.coverImage) {
      formData.append('coverImage', content.coverImage);
    }

    return this.http.post<CreateMusicContentResponse>(this.apiUrl, formData);
  }

  updateMusicContentMetaData(content: UpdateMusicContentMetadataRequest): Observable<UpdateMusicContentResponse> {
    const httpParams = new HttpParams().set('contentId', content.contentId);

    const body = {
      ...(content.title && {title: content.title}),
      ...(content.album && {album: content.album}),
      ...(content.genre && {genre: content.genre})
    }
    return this.http.put<UpdateMusicContentResponse>(this.apiUrl, body, {params: httpParams});
  }

  updateMusicContentFiles(content: UpdateMusicContentFilesRequest): Observable<UpdateMusicContentResponse> {
    const formData = new FormData();

    const metadata = {
      contentId: content.contentId,
      ...(content.title && {title: content.title}),
      ...(content.album && {album: content.album}),
      ...(content.genre && {genre: content.genre})
    };
    formData.append('metadata', JSON.stringify(metadata));

    if(content.audioFile) {
      formData.append('audioFile', content.audioFile);
    }

    if(content.coverImage) {
      formData.append('coverImage', content.coverImage);
    }

    return this.http.put<UpdateMusicContentResponse>(this.apiUrl, formData);
  }

  deleteMusicContent(contentId: string): Observable<DeleteMusicContentResponse> {
    const httpParams = new HttpParams().set('contentId', contentId);
    return this.http.delete<DeleteMusicContentResponse>(this.apiUrl, {params: httpParams});
  }

  //Helper methods to validate files

  validateAudioFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/ogg', 'audio/aac'];
    const maxSize = 10 * 1024 * 1024; //10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid audio file type. Allowed: MP3, WAV, MA4, OGG, AAC, FLAC' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'Audio file too large. Maximum size: 10MB' };
    }
    return { valid: true };
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if(!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid image file type. Allowed: JPEG, PNG, WEBP' };
    }
    if(file.size>maxSize) {
      return { valid: false, error: 'Image file too large. Maximum size: 5MB' };
    }
    return { valid: true };
  }
}
