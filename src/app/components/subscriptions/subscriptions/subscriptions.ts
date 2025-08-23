import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Button } from "primeng/button";
import { Toast } from "primeng/toast";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ProgressSpinner } from "primeng/progressspinner";
import { Message } from "primeng/message";
import { Card } from "primeng/card";
import { Chip } from "primeng/chip";
import { Divider } from "primeng/divider";
import { CommonModule } from '@angular/common';
import { SubscriptionsService } from '../../../services/subscriptions/subscription-service';
import { Subscription } from '../../../services/subscriptions/subscription-service';

@Component({
  selector: 'app-subscriptions',
  templateUrl: 'subscriptions.html',
  imports: [Button, Toast, ConfirmDialog, ProgressSpinner, Message, Card, CommonModule],
  standalone: true,
  providers: [MessageService, ConfirmationService],
})
export class SubscriptionsComponent implements OnInit {
  
  subscriptions: Subscription[] = [];
  isLoading = false;
  isLoadingMore = false;
  hasMore = false;
  errorMessage: string | null = null;
  
  constructor(
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private subscriptionService: SubscriptionsService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions = data.subscriptions;
        console.log(this.subscriptions)
        this.hasMore = data.hasMore;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load subscriptions';
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load subscriptions'
        });
      }
    });
      this.isLoading = false;
      this.hasMore = true;
  }

  unsubscribe(subscription: Subscription): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to unsubscribe from ${subscription.targetName}?`,
      header: 'Confirm Unsubscribe',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.subscriptionService.deleteSubscription(subscription.subscriptionId).subscribe({
          next: () => {
            this.subscriptions = this.subscriptions.filter(s => s.subscriptionId !== subscription.subscriptionId);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Unsubscribed from ${subscription.targetName}`
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to unsubscribe'
            });
          }
        });
      }
    });
  }

  getTruncatedId(id: string): string {
    if (!id) return '';
    return id.length > 12 ? `${id.substring(0, 8)}...${id.substring(id.length - 4)}` : id;
  }

  getFormattedDate(timestamp: string | Date): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}