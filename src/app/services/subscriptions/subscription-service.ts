import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../globals';

export interface Subscription {
  subscriptionId: string;
  username: string;
  type: string;
  targetId: string;
  targetName: string;
  timestamp: string | Date;
}

export interface CreateSubscriptionRequest {
  subscriptionType: string;
  targetId: string | undefined | null;
  targetName: string | undefined | null;
}

export interface GetSubscriptionsResponse {
  message: string;
  subscriptions: Subscription[];
  count: number;
  hasMore: boolean;
  lastKey?: string;
}

export interface CreateSubscriptionResponse {
  message: string;
  subscription: {
    subscriptionId: string;
    username: string;
    targetId: string;
    targetName: string;
  };
}

export interface IsSubscribedResponse {
  is_subscribed: boolean;
}

export interface GetSubscriptionsParams {
  limit?: number;
  lastKey?: string;
  username?: string;
  targetName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsService {
  private readonly apiUrl = `${API_URL}subscription`;
  private readonly notificationApi = `${API_URL}notification`;

  constructor(private http: HttpClient) {}

  /**
   * Get all subscriptions with optional filtering and pagination
   */
  getSubscriptions(params: GetSubscriptionsParams = {}): Observable<GetSubscriptionsResponse> {
    let httpParams = new HttpParams();
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.lastKey) {
      httpParams = httpParams.set('lastKey', params.lastKey);
    }

    if (params.targetName) {
      httpParams = httpParams.set('targetName', params.targetName);
    }

    return this.http.get<GetSubscriptionsResponse>(this.apiUrl, { params: httpParams });
  }

  createSubscription(subscriptionData: CreateSubscriptionRequest): Observable<CreateSubscriptionResponse> {
    return this.http.post<CreateSubscriptionResponse>(this.apiUrl, subscriptionData);
  }

  notifySubscribers(subscriptions: Subscription[]): Observable<CreateSubscriptionResponse> {
    return this.http.post<CreateSubscriptionResponse>(this.notificationApi, {subscriptions});
  }

  deleteSubscription(subscriptionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${subscriptionId}`);
  }

  isSubscribed(subscriptionType: any, target_id: any, target_name: any): Observable<IsSubscribedResponse> {
      return this.http.get<IsSubscribedResponse>(this.apiUrl + '/check', {
        params: { subscriptionType, target_id, target_name }
      });
    }
}