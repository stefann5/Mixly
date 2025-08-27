import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { AuthService } from '../service/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // URLs that should not include the Authorization header
  private readonly excludedUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh'
  ];

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this request should be excluded from authentication
    if (this.shouldExcludeUrl(request.url)) {
      return next.handle(request);
    }

    // Add auth header if user is authenticated
    const authRequest = this.addAuthHeader(request);

    return next.handle(authRequest).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          // Handle 401 Unauthorized errors
          if (error.status === 401) {
            return this.handle401Error(authRequest, next);
          }
          
          // Handle 403 Forbidden errors
          if (error.status === 403) {
            console.warn('Access forbidden - insufficient permissions');
            this.authService.logout();
            return throwError(() => error);
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Add Authorization header to request
   */
  private addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {
    const accessToken = this.authService.getAccessToken();

    const isFormData = request.body instanceof FormData;
    
    if (accessToken && this.authService.isAuthenticated()) {
      if(isFormData) {
        return request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    }
    
    if(isFormData) {
      return request;
    }
    return request.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if URL should be excluded from authentication
   */
  private shouldExcludeUrl(url: string): boolean {
    return this.excludedUrls.some(excludedUrl => url.includes(excludedUrl));
  }

  /**
   * Handle 401 Unauthorized errors by attempting to refresh token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      console.log('trying to refresh token');

      // Check if we should attempt token refresh
      if (this.authService.getRefreshToken()) {
        return this.authService.refreshTokens().pipe(
          switchMap((tokens: any) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(tokens.accessToken);
            
            // Retry the original request with new token
            const newRequest = this.addAuthHeader(request);
            return next.handle(newRequest);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => error);
          }),
          finalize(() => {
            this.isRefreshing = false;
          })
        );
      } else {
        // No refresh token available, logout user
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => new Error('Authentication required'));
      }
    } else {
      // Token refresh is already in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          const newRequest = this.addAuthHeader(request);
          return next.handle(newRequest);
        })
      );
    }
  }
}