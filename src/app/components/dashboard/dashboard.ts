import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebar } from "../sidebar/sidebar";
import { Badge } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationService } from '../../services/notification/notification-service';
import { Notification } from '../../services/notification/notification-service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/service/auth-service';

@Component({
  selector: 'app-dashboard',
  imports: [ButtonModule, RouterOutlet, CommonModule, Sidebar, BadgeModule, DrawerModule, CardModule, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [MessageService]
})
export class Dashboard {
  notifications: Notification[] = []

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  showNotifications = false;

  ngOnInit(){
    this.loadNotifications();
  }

private parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
  
  loadNotifications(): void {
    const token = this.authService.getAccessToken()
    if (token){
      const decoded = this.parseJwt(token);
    this.notificationService.getNotifications({subscriber: decoded.username}).subscribe({
      next: (data) => {
        this.notifications = data.notifications;
        console.log(this.notifications)
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load subscriptions'
        });
      }
    });
    }
  }
}

