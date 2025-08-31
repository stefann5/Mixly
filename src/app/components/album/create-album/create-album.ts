import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

// Services
import {
  MusicContentService,
  CreateMusicContentRequest,
} from '../../../services/music-content/music-content-service';
import { ArtistService } from '../../../services/artists/artist-service';
import { AlbumService, CreateAlbumRequest } from '../../../services/albums/album-service';
import { SubscriptionsService } from '../../../services/subscriptions/subscription-service';

interface GenreOption {
  label: string;
  value: string;
}

interface ArtistOption {
  label: string;
  value: string;
}

interface AlbumSong {
  title: string;
  genre?: string;
  audioFile: File;
  coverImage?: File;
}

@Component({
  selector: 'app-create-album',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    CardModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: './create-album.html',
  styleUrl: './create-album.scss',
  providers: [MessageService],
})
export class CreateAlbum implements OnInit {
  albumForm!: FormGroup;
  songForm!: FormGroup;
  
  // Loading states
  isCreatingAlbum = false;
  isAddingSong = false;

  // Form visibility
  showSongForm = false;

  // Files
  currentSongAudio: File | null = null;
  currentSongCover: File | null = null;

  // Album songs collection
  albumSongs: AlbumSong[] = [];

  // Dropdown options
  genreOptions: GenreOption[] = [
    { label: 'Pop', value: 'pop' },
    { label: 'Rock', value: 'rock' },
    { label: 'Hip Hop', value: 'hip-hop' },
    { label: 'Electronic', value: 'electronic' },
    { label: 'Jazz', value: 'jazz' },
    { label: 'Classical', value: 'classical' },
    { label: 'Country', value: 'country' },
    { label: 'R&B', value: 'rnb' },
    { label: 'Folk', value: 'folk' },
    { label: 'Alternative', value: 'alternative' },
    { label: 'TurboFolk', value: 'turboFolk' },
  ];

  artistOptions: ArtistOption[] = [{ label: 'Choose artist...', value: '' }];

  constructor(
    private fb: FormBuilder,
    private musicContentService: MusicContentService,
    private artistService: ArtistService,
    private albumService: AlbumService,
    private messageService: MessageService,
    private router: Router,
    private subscriptionService: SubscriptionsService
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.loadArtistOptions();
  }

  private initializeForms() {
    // Album form
    this.albumForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(100),
        ],
      ],
      artistId: ['', [Validators.required]],
      genre: ['', [Validators.required]],
    });

    // Song form
    this.songForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(100),
        ],
      ],
      genre: [''], // Optional, will default to album genre
    });
  }

  private loadArtistOptions() {
    this.artistService.getArtists().subscribe({
      next: (response) => {
        this.artistOptions = [{ label: 'Choose artist...', value: '' }];
        for (const artist of response.artists) {
          this.artistOptions.push({
            label: artist.name,
            value: artist.artistId,
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load artists',
        });
      },
    });
  }

  // Song form methods
  toggleSongForm() {
    this.showSongForm = !this.showSongForm;
    if (this.showSongForm) {
      this.resetSongForm();
    }
  }

  closeSongForm() {
    this.showSongForm = false;
    this.resetSongForm();
  }

  private resetSongForm() {
    this.songForm.reset();
    this.currentSongAudio = null;
    this.currentSongCover = null;
  }

  onSongAudioSelect(event: any) {
    const file = event.files[0];
    if (file) {
      const validation = this.musicContentService.validateAudioFile(file);
      if (validation.valid) {
        this.currentSongAudio = file;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Audio file "${file.name}" selected`,
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error,
        });
        this.currentSongAudio = null;
      }
    }
  }

  onSongAudioRemove() {
    this.currentSongAudio = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Removed',
      detail: 'Audio file removed',
    });
  }

  onSongCoverSelect(event: any) {
    const file = event.files[0];
    if (file) {
      const validation = this.musicContentService.validateImageFile(file);
      if (validation.valid) {
        this.currentSongCover = file;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Song cover "${file.name}" selected`,
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error,
        });
        this.currentSongCover = null;
      }
    }
  }

  onSongCoverRemove() {
    this.currentSongCover = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Removed',
      detail: 'Song cover removed',
    });
  }

  // Song management methods
  addSongToAlbum() {
    if (this.canAddSong()) {
      this.isAddingSong = true;
      
      const formValues = this.songForm.value;
      const newSong: AlbumSong = {
        title: formValues.title,
        genre: formValues.genre || this.albumForm.get('genre')?.value,
        audioFile: this.currentSongAudio!,
        ...(this.currentSongCover && { coverImage: this.currentSongCover }),
      };

      // Check for duplicate song titles
      const duplicateSong = this.albumSongs.find(
        song => song.title.toLowerCase() === newSong.title.toLowerCase()
      );

      if (duplicateSong) {
        this.messageService.add({
          severity: 'error',
          summary: 'Duplicate Song',
          detail: 'A song with this title already exists in the album',
        });
        this.isAddingSong = false;
        return;
      }

      // Add song to album
      this.albumSongs.push(newSong);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Song Added',
        detail: `"${newSong.title}" added to album`,
      });

      this.resetSongForm();
      this.showSongForm = false;
      this.isAddingSong = false;
    }
  }

  removeSong(index: number) {
    const removedSong = this.albumSongs.splice(index, 1)[0];
    this.messageService.add({
      severity: 'info',
      summary: 'Song Removed',
      detail: `"${removedSong.title}" removed from album`,
    });
  }

  // Creation method
  async createAlbum() {
    if (!this.canCreateAlbum()) {
      this.markAlbumFormTouched();
      return;
    }

    this.isCreatingAlbum = true;
    
    try {
      const albumValues = this.albumForm.value;
      const createdSongIds: string[] = [];

      // First create all songs
      for (let i = 0; i < this.albumSongs.length; i++) {
        const song = this.albumSongs[i];
        
        const songRequest: CreateMusicContentRequest = {
          title: song.title,
          artistId: albumValues.artistId,
          album: albumValues.title, // Set album title
          genre: song.genre,
          audioFile: song.audioFile,
          ...(song.coverImage && { coverImage: song.coverImage }),
        };

        try {
          const response = await this.musicContentService.createMusicContent(songRequest).toPromise();
          if (response?.contentId) {
            createdSongIds.push(response.contentId);
          }
        } catch (error) {
          console.error(`Error creating song "${song.title}":`, error);
          this.messageService.add({
            severity: 'error',
            summary: 'Song Creation Failed',
            detail: `Failed to create song "${song.title}"`,
          });
          this.isCreatingAlbum = false;
          return;
        }
      }

      // Then create the album with all song IDs
      const albumRequest: CreateAlbumRequest = {
        title: albumValues.title,
        artistId: albumValues.artistId,
        genre: albumValues.genre,
        tracksIds: createdSongIds,
      };
      console.log(albumRequest);
      this.albumService.createAlbum(albumRequest).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Album Created',
            detail: `Album "${response.album.title}" created successfully with ${this.albumSongs.length} songs`,
          });

          // Notify subscribers
          this.notifySubscribers(albumValues);

          // Navigate back after showing success message
          setTimeout(() => {
            this.router.navigate(['/dashboard/music-content']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating album:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Album Creation Failed',
            detail: 'Failed to create album. Songs were created but album creation failed.',
          });
          this.isCreatingAlbum = false;
        }
      });

    } catch (error) {
      console.error('Error creating album:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Creation Failed',
        detail: 'An unexpected error occurred while creating the album',
      });
      this.isCreatingAlbum = false;
    }
  }

  private notifySubscribers(albumValues: any) {
    // Notify genre subscribers
    if (albumValues.genre) {
      this.subscriptionService.getSubscriptions({ targetName: albumValues.genre }).subscribe({
        next: (response) => {
          if (response?.subscriptions.length > 0) {
            this.subscriptionService.notifySubscribers(response.subscriptions).subscribe({
              next: () => console.log('Genre subscribers notified for album'),
              error: (err) => console.error('Error notifying genre subscribers:', err),
            });
          }
        },
        error: (err) => console.error('Error getting genre subscriptions:', err),
      });
    }

    // Notify artist subscribers
    if (albumValues.artistId) {
      const artistName = this.getArtistLabel(albumValues.artistId);
      this.subscriptionService.getSubscriptions({ targetName: artistName }).subscribe({
        next: (response) => {
          if (response?.subscriptions.length > 0) {
            this.subscriptionService.notifySubscribers(response.subscriptions).subscribe({
              next: () => console.log('Artist subscribers notified for album'),
              error: (err) => console.error('Error notifying artist subscribers:', err),
            });
          }
        },
        error: (err) => console.error('Error getting artist subscriptions:', err),
      });
    }
  }

  // Helper methods
  canAddSong(): boolean {
    return this.songForm.valid && !!this.currentSongAudio;
  }

  canCreateAlbum(): boolean {
    return this.albumForm.valid && this.albumSongs.length > 0;
  }

  getSelectedAlbumGenre(): string {
    const genreValue = this.albumForm.get('genre')?.value;
    const genre = this.genreOptions.find(g => g.value === genreValue);
    return genre?.label || 'No genre selected';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getArtistLabel(artistId: string): string {
    const artist = this.artistOptions.find(option => option.value === artistId);
    return artist?.label || '';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/music-content']);
  }

  // Validation helper methods for album form
  isAlbumFieldInvalid(fieldName: string): boolean {
    const field = this.albumForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getAlbumFieldError(fieldName: string): string {
    const field = this.albumForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at most ${
          field.errors['maxlength'].requiredLength
        } characters`;
      }
    }
    return '';
  }

  // Validation helper methods for song form
  isSongFieldInvalid(fieldName: string): boolean {
    const field = this.songForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getSongFieldError(fieldName: string): string {
    const field = this.songForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at most ${
          field.errors['maxlength'].requiredLength
        } characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      title: 'Title',
      artistId: 'Artist',
      genre: 'Genre',
    };
    return displayNames[fieldName] || fieldName;
  }

  private markAlbumFormTouched() {
    Object.keys(this.albumForm.controls).forEach((key) => {
      const control = this.albumForm.get(key);
      control?.markAsTouched();
    });

    if (this.albumSongs.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'No Songs',
        detail: 'Please add at least one song to the album',
      });
    }
  }
}