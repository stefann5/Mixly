import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranscriptionResponse {
  contentId: string;
  transcriptionId?: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'NOT_FOUND';
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  text?: string;
  confidence?: number;
  wordCount?: number;
  html?: string;
  css?: string;
  srt?: string;
  vtt?: string;
  words?: WordTiming[];
  segments?: TranscriptionSegment[];
  errorMessage?: string;
}

export interface WordTiming {
  content: string;
  confidence: number;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface TranscriptionSegment {
  transcript: string;
  startTime: number;
  endTime: number;
  alternatives: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService {
  private readonly apiUrl = 'https://04l1l5qj47.execute-api.eu-central-1.amazonaws.com/api/transcription';

  constructor(private http: HttpClient) { }

  getTranscription(contentId: string, format: 'json' | 'html' | 'srt' | 'vtt' = 'html'): Observable<TranscriptionResponse> {
    const params = new HttpParams()
      .set('contentId', contentId)
      .set('format', format);

    return this.http.get<TranscriptionResponse>(this.apiUrl, { params });
  }
}