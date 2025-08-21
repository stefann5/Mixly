import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../service/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Check for role-based access if specified in route data
          const requiredRole = route.data?.['role'];
          if (requiredRole) {
            const hasRequiredRole = this.authService.hasRole(requiredRole);
            if (!hasRequiredRole) {
              console.warn(`Access denied: Required role '${requiredRole}' not found`);
              return this.router.createUrlTree(['/']);
            }
          }
          
          return true;
        } else {
          // Store the attempted URL for redirecting after login
          const returnUrl = state.url;
          return this.router.createUrlTree(['/'], { 
            queryParams: { returnUrl } 
          });
        }
      })
    );
  }
}