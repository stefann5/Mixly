import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG imports for version 20
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { Artist, ArtistService } from '../../../services/artists/artist-service';


@Component({
  selector: 'app-view-artists',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DividerModule,
    ChipModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './view-artist.html'
})
export class ViewArtists implements OnInit {
  artists: Artist[] = [];
  isLoading = false;
  isLoadingMore = false;
  errorMessage = '';
  hasMore = false;
  lastKey = '';

  constructor(
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private artistService: ArtistService
  ) {}

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(loadMore = false): void {
    if (loadMore) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
      this.artists = [];
      this.lastKey = '';
    }

    this.errorMessage = '';

    const params = {
      limit: 12,
      ...(loadMore && this.lastKey ? { lastKey: this.lastKey } : {})
    };

    this.artistService.getArtists(params).subscribe({
      next: (response) => {
        if (loadMore) {
          this.artists = [...this.artists, ...response.artists];
        } else {
          this.artists = response.artists;
        }

        this.hasMore = response.hasMore;
        this.lastKey = response.lastKey || '';
      },
      error: (error) => {
        this.errorMessage = error.error?.error || error.message || 'Failed to load artists. Please try again.';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage
        });
      },
      complete: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    });
  }

  loadMoreArtists(): void {
    this.loadArtists(true);
  }

  navigateToCreate(): void {
    this.router.navigate(['dashboard/create-artist']);
  }

  viewArtistDetails(artist: Artist): void {
    // Navigate to artist details page
    this.router.navigate(['/artists', artist.artistId]);
  }

  editArtist(artist: Artist): void {
    // Navigate to edit artist page
    this.router.navigate(['/artists', artist.artistId, 'edit']);
  }

  deleteArtist(artist: Artist): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${artist.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.artistService.deleteArtist(artist.artistId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Artist deleted successfully'
            });
            
            // Remove artist from local array
            this.artists = this.artists.filter(a => a.artistId !== artist.artistId);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.error || 'Failed to delete artist'
            });
          }
        });
      }
    });
  }

  getTruncatedBiography(biography: string): string {
    return biography.length > 150 ? biography.substring(0, 150) + '...' : biography;
  }

  isAdmin(): boolean {
    // Check if user has admin role
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return userRole === 'admin' || this.getUserGroups().includes('administrators');
  }

  private getUserGroups(): string[] {
    const groups = localStorage.getItem('userGroups') || sessionStorage.getItem('userGroups') || '';
    return groups.split(',').filter(g => g.trim().length > 0);
  }
}