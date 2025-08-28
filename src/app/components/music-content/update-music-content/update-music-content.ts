import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { MusicContentService, UpdateMusicContentFilesRequest, MusicContent } from '../../../services/music-content/music-content-service';
import { ArtistService } from '../../../services/artists/artist-service';
import { SelectModule } from 'primeng/select';

interface GenreOption {
  label: string;
  value: string;
}

interface ArtistOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-update-music-content',
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
    DividerModule
  ],
  templateUrl: './update-music-content.html',
  styleUrl: './update-music-content.scss',
  providers: [MessageService]
})
export class UpdateMusicContent implements OnInit {
  musicForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  contentId!: string;
  currentMusicContent?: MusicContent;
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
    { label: 'TurboFolk', value: 'turboFolk' }
  ];
  
  //Dropdown options for artist
  artistOptions: ArtistOption[] = [
    { label: 'Choose artist...', value: '' }
  ];

  constructor(
    private fb: FormBuilder,
    private musicContentService: MusicContentService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private artistService: ArtistService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.getContentId();
    this.filloutArtistOptions();
  }

  private initializeForm() {
    this.musicForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      artistId: ['', [Validators.required]],
      album: ['', [Validators.maxLength(100)]],
      genre: ['']
    });
  }

  private getContentId() {
    this.contentId = this.route.snapshot.paramMap.get('contentId') || '';
    if (this.contentId) {
      this.loadMusicContentData();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Content ID not found in URL'
      });
      this.router.navigate(['dashboard/music-content']);
    }
  }

  private loadMusicContentData() {
    this.isLoadingData = true;
    this.musicContentService.getMusicContentById(this.contentId).subscribe({
      next: (musicContent) => {
        this.currentMusicContent = musicContent.content;
        this.populateForm();
        this.isLoadingData = false;
      },
      error: (error) => {
        this.isLoadingData = false;
        console.error('Error loading music content:', error);
        
        let errorMessage = 'Error loading music content';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        
        // Navigate back if content not found
        setTimeout(() => {
          this.router.navigate(['dashboard/music-content']);
        }, 2000);
      }
    });
  }

  private populateForm() {
    console.log('currentMusicContent', this.currentMusicContent);
    if (this.currentMusicContent) {
      this.musicForm.patchValue({
        title: this.currentMusicContent.title,
        artistId: this.currentMusicContent.artistId,
        album: this.currentMusicContent.album || '',
        genre: this.currentMusicContent.genre || ''
      });
    }
  }

  filloutArtistOptions() {
    this.artistService.getArtists().subscribe({
      next: (response) => {
        for(const artist of response.artists) {
          this.artistOptions.push({ label: artist.name, value: artist.artistId });
        }
        // After artists are loaded, populate the form if data is already available
        if (this.currentMusicContent) {
          this.populateForm();
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.detail || 'Error loading artists'
        });
      }
    });
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
          detail: `Audio file "${file.name}" is chosen`
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error
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
          detail: `Picture "${file.name}" is chosen`
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: validation.error
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
      detail: 'Audio file is removed'
    });
  }

  onCoverImageRemove() {
    this.coverImage = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Removed picture',
      detail: 'Picture is removed'
    });
  }

  onSubmit() {
    if (this.musicForm.valid) {
      this.isLoading = true;

      const formValues = this.musicForm.value;
      
      // Determine which method to use based on whether files were uploaded
      if (this.audioFile || this.coverImage) {
        // Use updateMusicContentFiles if files were uploaded
        const request: UpdateMusicContentFilesRequest = {
          contentId: this.contentId,
          title: formValues.title,
          album: formValues.album || '',
          genre: formValues.genre || '',
          ...(this.audioFile && { audioFile: this.audioFile }),
          ...(this.coverImage && { coverImage: this.coverImage })
        };

        this.musicContentService.updateMusicContentFiles(request).subscribe({
          next: (response) => {
            this.handleUpdateSuccess(response.content.title);
          },
          error: (error) => {
            this.handleUpdateError(error);
          }
        });
      } else {
        // Use updateMusicContentMetaData if only metadata was changed
        const request = {
          contentId: this.contentId,
          title: formValues.title,
          album: formValues.album || '',
          genre: formValues.genre || ''
        };

        this.musicContentService.updateMusicContentMetaData(request).subscribe({
          next: (response) => {
            this.handleUpdateSuccess(response.content.title);
          },
          error: (error) => {
            this.handleUpdateError(error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleUpdateSuccess(title: string) {
    this.isLoading = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Song "${title}" updated successfully`
    });
    
    // Wait for toast to show before navigation
    setTimeout(() => {
      this.router.navigate(['dashboard/music-content']);
    }, 1500);
  }

  private handleUpdateError(error: any) {
    this.isLoading = false;
    console.error('Error updating song:', error);
    
    let errorMessage = 'Error updating song';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.musicForm.controls).forEach(key => {
      const control = this.musicForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['dashboard/music-content']);
  }

  // Helper methods for validation in template
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
        return `${this.getFieldDisplayName(fieldName)} has to have at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} has to have at most ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'title': 'Title',
      'artistId': 'Artist',
      'album': 'Album',
      'genre': 'Genre'
    };
    return displayNames[fieldName] || fieldName;
  }
}