import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_URL } from '../../globals';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegistrationRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface RegistrationResponse {
  message: string;
  userId: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  user: {
    userId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
  username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  'custom:role'?: string;
  'cognito:groups'?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = API_URL; // Replace with your API Gateway URL
  private readonly TOKEN_KEY = 'music_app_tokens';
  private readonly USER_KEY = 'music_app_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuth(): void {
    const tokens = this.getStoredTokens();
    const user = this.getStoredUser();

    if (tokens && user && this.isTokenValid(tokens.accessToken)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Login user with username and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.handleLoginSuccess(response);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegistrationRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        catchError(error => {
          console.error('Registration failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Handle successful login response
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(response.tokens));
    
    // Store user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    // Update subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Logout user and clear all stored data
   */
  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get access token for API requests
   */
  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Get ID token
   */
  getIdToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.idToken || null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Get stored tokens from localStorage
   */
  private getStoredTokens(): LoginResponse['tokens'] | null {
    try {
      const tokens = localStorage.getItem(this.TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): DecodedToken {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens && this.isTokenValid(tokens.accessToken));
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('administrator');
  }

  /**
   * Refresh tokens using refresh token
   * Note: You'll need to implement this endpoint in your Lambda
   */
  refreshTokens(): Observable<LoginResponse['tokens']> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse['tokens']>(`${this.API_URL}/auth/refresh`, {
      refreshToken
    }).pipe(
      tap(tokens => {
        // Update stored tokens
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    try {
      const decoded = this.decodeToken(accessToken);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token expires soon (within 5 minutes)
   */
  shouldRefreshToken(): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) return false;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration <= fiveMinutesFromNow;
  }
}