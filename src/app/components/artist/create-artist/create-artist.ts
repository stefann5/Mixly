import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG imports for version 20
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ArtistService, CreateArtistRequest } from '../../../services/artists/artist-service';


@Component({
  selector: 'app-create-artist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ChipModule,
    ButtonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './create-artist.html'
})
export class CreateArtist implements OnInit {
  artist: CreateArtistRequest = {
    name: '',
    biography: '',
    genres: []
  };

  genreInput = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private messageService: MessageService,
    private artistService: ArtistService
  ) { }

  ngOnInit(): void {
    // Component initialization
  }

  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Validate genres are not empty
    if (this.artist.genres.length === 0) {
      this.errorMessage = 'At least one genre is required';
      this.isLoading = false;
      return;
    }

    this.artistService.createArtist(this.artist).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Artist created successfully!'
        });

        // Reset form
        this.resetForm();
        this.isLoading = false;


        // Navigate to artists list after short delay
        setTimeout(() => {
          this.router.navigate(['dashboard/view-artists']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;

        this.errorMessage = error.error?.error || error.message || 'Failed to create artist. Please try again.';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['dashboard/view-artists']);
  }

  onGenreInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',') {
      event.preventDefault();
      this.addGenre();
    }
  }

  onGenreInputBlur(): void {
    if (this.genreInput.trim()) {
      this.addGenre();
    }
  }

  addGenre(): void {
    const genre = this.genreInput.trim().toLowerCase();
    if (genre && !this.artist.genres.includes(genre)) {
      this.artist.genres.push(genre);
      this.genreInput = '';
    }
  }

  removeGenre(index: number): void {
    this.artist.genres.splice(index, 1);
  }

  private resetForm(): void {
    this.artist = {
      name: '',
      biography: '',
      genres: []
    };
    this.genreInput = '';
    this.errorMessage = '';
  }
}