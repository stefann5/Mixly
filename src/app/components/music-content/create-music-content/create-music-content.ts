import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import {
  MusicContentService,
  CreateMusicContentRequest,
} from '../../../services/music-content/music-content-service';
import { ArtistService } from '../../../services/artists/artist-service';
import { SelectModule } from 'primeng/select';
import { SubscriptionsService } from '../../../services/subscriptions/subscription-service';

interface GenreOption {
  label: string;
  value: string;
}

interface ArtistOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-create-music-content',
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
  ],
  templateUrl: './create-music-content.html',
  styleUrl: './create-music-content.scss',
  providers: [MessageService],
})
export class CreateMusicContent implements OnInit {
  musicForm!: FormGroup;
  isLoading = false;
  audioFile: File | null = null;
  coverImage: File | null = null;
  //Dropdown options for genre
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
  //Dropdown options for artist
  artistOptions: ArtistOption[] = [{ label: 'Choose artist...', value: '' }];

  constructor(
    private fb: FormBuilder,
    private musicContentService: MusicContentService,
    private messageService: MessageService,
    private router: Router,
    private artistService: ArtistService,
    private subscriptionService: SubscriptionsService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.filloutArtistOptions();
  }

  private initializeForm() {
    this.musicForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(100),
        ],
      ],
      artistId: ['', [Validators.required]],
      album: ['', [Validators.maxLength(100)]],
      genre: [''],
    });
  }

  filloutArtistOptions() {
    this.artistService.getArtists().subscribe({
      next: (response) => {
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
          detail: error.detail,
        });
      },
    });
  }
  private getArtistLabel(artistId: string): string {
    const artist = this.artistOptions.find(
      (option) => option.value === artistId
    );
    return artist ? artist.label : '';
  }
  onAudioFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      const validation = this.musicContentService.validateAudioFile(file);
      if (validation.valid) {
        this.audioFile = file;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Audio file "${file.name}" is chosen`,
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error,
        });
        this.audioFile = null;
      }
    }
  }

  onCoverImageSelect(event: any) {
    const file = event.files[0];
    if (file) {
      const validation = this.musicContentService.validateImageFile(file);
      if (validation.valid) {
        this.coverImage = file;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Picture "${file.name}" is chosen`,
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error,
        });
        this.coverImage = null;
      }
    }
  }

  onAudioFileRemove() {
    this.audioFile = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Removed file',
      detail: 'Audio file is removed',
    });
  }

  onCoverImageRemove() {
    this.coverImage = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Removed picture',
      detail: 'Picture is removed',
    });
  }

  onSubmit() {
    if (this.musicForm.valid && this.audioFile) {
      this.isLoading = true;

      const formValues = this.musicForm.value;
      const request: CreateMusicContentRequest = {
        title: formValues.title,
        artistId: formValues.artistId,
        audioFile: this.audioFile,
        ...(formValues.album && { album: formValues.album }),
        ...(formValues.genre && { genre: formValues.genre }),
        ...(this.coverImage && { coverImage: this.coverImage }),
      };
      this.notifySubscribers(formValues);

      this.musicContentService.createMusicContent(request).subscribe({
        next: (response) => {
          // Obavesti subscribers nakon uspešnog kreiranja
          this.notifySubscribers(formValues);

          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Song "${response.title}" created successfully`,
          });

          // Waiting for toast to show before navigation
          setTimeout(() => {
            this.router.navigate(['dashboard/music-content']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating song:', error);

          let errorMessage = 'Error creating song';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
          });
        },
      });
    } else {
      this.markFormGroupTouched();
      if (!this.audioFile) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Please choose song file',
        });
      }
    }
  }

  private notifySubscribers(formValues: any) {
    // 1. Obavesti genre subscribers (ako postoji genre)
    if (formValues.genre) {
      this.subscriptionService
        .getSubscriptions({ targetName: formValues.genre })
        .subscribe({
          next: (response) => {
            if (response && response.subscriptions.length > 0) {
              this.subscriptionService
                .notifySubscribers(response.subscriptions)
                .subscribe({
                  next: () => console.log('Genre subscribers notified'),
                  error: (err) =>
                    console.error('Error notifying genre subscribers:', err),
                });
            }
          },
          error: (err) =>
            console.error('Error getting genre subscriptions:', err),
        });
    }

    // 2. Obavesti artist subscribers
    if (formValues.artistId) {
      this.subscriptionService
        .getSubscriptions({
          targetName: this.getArtistLabel(formValues.artistId),
        })
        .subscribe({
          next: (response) => {
            if (response && response.subscriptions.length > 0) {
              this.subscriptionService
                .notifySubscribers(response.subscriptions)
                .subscribe({
                  next: () => console.log('Artist subscribers notified'),
                  error: (err) =>
                    console.error('Error notifying artist subscribers:', err),
                });
            }
          },
          error: (err) =>
            console.error('Error getting artist subscriptions:', err),
        });
    }
  }

  // onSubmit() {
  //   if (this.musicForm.valid && this.audioFile) {
  //     this.isLoading = true;

  //     const formValues = this.musicForm.value;
  //     const request: CreateMusicContentRequest = {
  //       title: formValues.title,
  //       artistId: formValues.artistId,
  //       audioFile: this.audioFile,
  //       ...(formValues.album && { album: formValues.album }),
  //       ...(formValues.genre && { genre: formValues.genre }),
  //       ...(this.coverImage && { coverImage: this.coverImage })
  //     };

  //     this.musicContentService.createMusicContent(request).subscribe({
  //       next: (response) => {
  //         this.isLoading = false;
  //         this.messageService.add({
  //           severity: 'success',
  //           summary: 'Success',
  //           detail: `Song "${response.title}" created successfully`
  //         });
  //         //Waiting for toast to show before navigation
  //         setTimeout(() => {
  //           this.router.navigate(['dashboard/music-content']);
  //         }, 1500);
  //       },
  //       error: (error) => {
  //         this.isLoading = false;
  //         console.error('Error creating song:', error);

  //         let errorMessage = 'Error creating song';
  //         if (error.error?.message) {
  //           errorMessage = error.error.message;
  //         } else if (error.message) {
  //           errorMessage = error.message;
  //         }

  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: errorMessage
  //         });
  //       }
  //     });
  //   } else {
  //     this.markFormGroupTouched();
  //     if (!this.audioFile) {
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'Please choose song file'
  //       });
  //     }
  //   }
  // }

  private markFormGroupTouched() {
    Object.keys(this.musicForm.controls).forEach((key) => {
      const control = this.musicForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['dashboard/music-content']);
  }
  //Helper methods for validation in template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.musicForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.musicForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} has to have at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} has to have at most ${
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
      album: 'Album',
      genre: 'Genre',
    };
    return displayNames[fieldName] || fieldName;
  }
}
