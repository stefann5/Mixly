import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../globals';

export interface Notification {
  notificationId: string;
  subscriber: string;
  contentId: string;
  content: string;
  message: string;
  timestamp: string | Date;
}

export interface GetNotificationsResponse {
  message: string;
  notifications: Notification[];
  count: number;
  hasMore: boolean;
  lastKey?: string;
}

export interface GetNotificationsParams {
  limit?: number;
  lastKey?: string;
  subscriber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${API_URL}/notification`;

  constructor(private http: HttpClient) {}

  /**
   * Get all subscriptions with optional filtering and pagination
   */
  getNotifications(params: GetNotificationsParams = {}): Observable<GetNotificationsResponse> {
    let httpParams = new HttpParams();
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.lastKey) {
      httpParams = httpParams.set('lastKey', params.lastKey);
    }
    
    if (params.subscriber) {
      httpParams = httpParams.set('subscriber', params.subscriber);
    }

    return this.http.get<GetNotificationsResponse>(this.apiUrl, { params: httpParams });
  }
}