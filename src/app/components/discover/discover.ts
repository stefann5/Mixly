import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { Album, Artist, DiscoverService, Genre, MusicContent } from '../../services/discover/discover-service';
import { ArtistService, GetArtistsParams } from '../../services/artists/artist-service';
import { MusicContentService } from '../../services/music-content/music-content-service';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { RatingService } from '../../services/rating/rating-service';
import { SubscriptionsService } from '../../services/subscriptions/subscription-service';



interface DropdownOption {
  label: string;
  value: string;
}

interface PlaybackState {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  currentContentId: string | null;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    CardModule,
    PanelModule,
    ButtonModule,
    ProgressSpinnerModule,
    DataViewModule,
    TagModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    BadgeModule,
    ImageModule,
    ToastModule,
    DialogModule,
    RatingModule
  ],
  templateUrl: "discover.html",
  styles: [`
    :host ::ng-deep {
      .p-panel-header {
        background: var(--surface-50);
        border: 1px solid var(--surface-200);
      }
      
      .p-dropdown {
        min-width: 200px;
      }

      .hover\\:bg-hover:hover {
        background: var(--surface-100);
      }

      .bg-primary-50 {
        background: var(--primary-50);
        border-color: var(--primary-200);
      }

      .transition-colors {
        transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
      }

      .transition-duration-150 {
        transition-duration: 150ms;
      }
    }
  `],
  providers: [MessageService]
})
export class Discover implements OnInit {
  // Loading states
  loadingGenres = false;
  loadingArtists = false;
  loadingAlbums = false;
  loadingContent = false;
  loadingMoreArtists = false;
  loadingMoreAlbums = false;
  loadingMoreContent = false;

  // Data
  genres: Genre[] = [];
  artists: Artist[] = [];
  albums: Album[] = [];
  content: MusicContent[] = [];

  // Pagination
  artistsLastKey?: string;
  albumsLastKey?: string;
  contentLastKey?: string;
  artistsHasMore = false;
  albumsHasMore = false;
  contentHasMore = false;

  // Selection
  selectedGenre?: string;
  selectedGenreData?: Genre;
  selectedArtist?: Artist;
  selectedAlbum?: Album;

  // UI Data
  genreOptions: DropdownOption[] = [];

  // Playback functionality
  playbackState: PlaybackState = {
    isPlaying: false,
    currentAudio: null,
    currentContentId: null
  };

  constructor(
    private discoverService: DiscoverService,
    private artistService: ArtistService,
    private messageService: MessageService,
    private musicContentService: MusicContentService,
    private ratingService: RatingService,
    private subscriptionService: SubscriptionsService
  ) {}

  ngOnInit() {
    this.loadGenres();
  }

  loadGenres() {
    this.loadingGenres = true;
    this.discoverService.getGenres().subscribe({
      next: (response) => {
        this.genres = response.genres;
        this.genreOptions = response.genres.map(genre => ({
          label: `${genre.genre} (${genre.totalItems})`,
          value: genre.genre.toLowerCase()
        }));
        this.loadingGenres = false;
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.loadingGenres = false;
      }
    });
  }

  onGenreChange(event: any) {
    const genreName = event.value;
    if (genreName) {
      this.selectedGenreData = this.genres.find(g => g.genre.toLowerCase() === genreName);
      this.resetSelections();
      this.loadArtistsAndAlbums(genreName);
    }
  }

  loadArtistsAndAlbums(genre: string) {
    // Load artists
    this.loadingArtists = true;
    this.discoverService.getArtistsByGenre(genre, 10).subscribe({
      next: (response) => {
        this.artists = response.artists;
        this.artistsHasMore = response.hasMore;
        this.artistsLastKey = response.lastKey;
        this.loadingArtists = false;
      },
      error: (error) => {
        console.error('Error loading artists:', error);
        this.loadingArtists = false;
      }
    });

    // Load albums
    this.loadingAlbums = true;
    this.discoverService.getAlbumsByGenre(genre, 'newest', 10).subscribe({
      next: (response) => {
        this.albums = response.albums;
        this.albumsHasMore = response.hasMore;
        this.albumsLastKey = response.lastKey;
        this.loadingAlbums = false;
      },
      error: (error) => {
        console.error('Error loading albums:', error);
        this.loadingAlbums = false;
      }
    });
  }

  selectArtist(artist: Artist) {
    if (this.selectedArtist?.artistId === artist.artistId) {
      return; // Already selected
    }
    
    this.selectedArtist = artist;
    this.selectedAlbum = undefined;
    this.loadContentForArtist(artist);
  }

  selectAlbum(album: Album) {
    if (this.selectedAlbum?.albumId === album.albumId) {
      return; // Already selected
    }
    
    this.selectedAlbum = album;
    this.selectedArtist = undefined;
    this.loadContentForAlbum(album);
  }

  loadContentForArtist(artist: Artist) {
    if (!this.selectedGenre) return;

    this.loadingContent = true;
    this.content = [];
    this.contentLastKey = undefined;

    this.musicContentService.getMusicContentByArtistId(artist.artistId).subscribe({
      next: async (response) => {
        this.content = response.content;
        this.contentHasMore = response.hasMore;
        this.contentLastKey = response.lastKey;
        
        // Add artist names to content
        
        
        this.loadingContent = false;
      },
      error: (error) => {
        console.error('Error loading content for artist:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load content for artist'
        });
        this.loadingContent = false;
      }
    });
  }

  loadContentForAlbum(album: Album) {
    this.loadingContent = true;
    this.content = [];
    this.contentLastKey = undefined;

    this.musicContentService.getMusicContentByAlbumId(album.albumId).subscribe({
      next: async (response) => {
        this.content = response.content;
        this.contentHasMore = response.hasMore;
        this.contentLastKey = response.lastKey;
        
        // Add artist names to content
        
        
        this.loadingContent = false;
      },
      error: (error) => {
        console.error('Error loading content for album:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load content for album'
        });
        this.loadingContent = false;
      }
    });
  }

  loadMoreArtists() {
    if (!this.selectedGenre || !this.artistsLastKey) return;

    this.loadingMoreArtists = true;
    this.discoverService.getArtistsByGenre(this.selectedGenre, 10, this.artistsLastKey).subscribe({
      next: (response) => {
        this.artists = [...this.artists, ...response.artists];
        this.artistsHasMore = response.hasMore;
        this.artistsLastKey = response.lastKey;
        this.loadingMoreArtists = false;
      },
      error: (error) => {
        console.error('Error loading more artists:', error);
        this.loadingMoreArtists = false;
      }
    });
  }

  loadMoreAlbums() {
    if (!this.selectedGenre || !this.albumsLastKey) return;

    this.loadingMoreAlbums = true;
    this.discoverService.getAlbumsByGenre(this.selectedGenre, 'newest', 10, this.albumsLastKey).subscribe({
      next: (response) => {
        this.albums = [...this.albums, ...response.albums];
        
        this.albumsHasMore = response.hasMore;
        this.albumsLastKey = response.lastKey;
        this.loadingMoreAlbums = false;
      },
      error: (error) => {
        console.error('Error loading more albums:', error);
        this.loadingMoreAlbums = false;
      }
    });
  }

  loadMoreContent() {
    if (!this.contentLastKey) return;

    this.loadingMoreContent = true;
    
    if (this.selectedArtist && this.selectedGenre) {
      this.musicContentService.getMusicContentByArtistId(
        this.selectedArtist.artistId
      ).subscribe({
        next: (response) => {
          this.content = [...this.content, ...response.content];
          this.contentHasMore = response.hasMore;
          this.contentLastKey = response.lastKey;
          this.loadingMoreContent = false;
        },
        error: (error) => {
          console.error('Error loading more content:', error);
          this.loadingMoreContent = false;
        }
      });
    } else if (this.selectedAlbum) {
      this.musicContentService.getMusicContentByAlbumId(
        this.selectedAlbum.albumId
      ).subscribe({
        next: (response) => {
          this.content = [...this.content, ...response.content];
          this.contentHasMore = response.hasMore;
          this.contentLastKey = response.lastKey;
          this.loadingMoreContent = false;
        },
        error: (error) => {
          console.error('Error loading more content:', error);
          this.loadingMoreContent = false;
        }
      });
    }
  }

  resetSelections() {
    this.selectedArtist = undefined;
    this.selectedAlbum = undefined;
    this.artists = [];
    this.albums = [];
    this.content = [];
    this.artistsLastKey = undefined;
    this.albumsLastKey = undefined;
    this.contentLastKey = undefined;
    this.artistsHasMore = false;
    this.albumsHasMore = false;
    this.contentHasMore = false;
  }

  getGenreByName(genreName: string): Genre | undefined {
    return this.genres.find(g => g.genre.toLowerCase() === genreName);
  }

  getContentPanelTitle(): string {
    if (this.selectedAlbum) {
      return `Songs from album "${this.selectedAlbum.title}"`;
    } else if (this.selectedArtist) {
      return `Content by "${this.selectedArtist.name}"`;
    }
    return 'Content';
  }

  // Music playback functionality from ViewMusicContent
  playContent(content: MusicContent): void {
    this.stopCurrentPlayback();
    if(content.contentId === this.playbackState.currentContentId) {
      this.playbackState.currentAudio?.play();
      this.playbackState.isPlaying = true;
      return;
    }
    const audio = new Audio(content.streamURL);

    audio.addEventListener('canplay', () => {
      audio.play().catch(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to play audio'
        });
      });
    });

    audio.addEventListener('ended', () => {
      this.resetPlaybackState();
    });

    audio.addEventListener('error', (e) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load audio stream'
      });
      this.resetPlaybackState();
    });

    this.playbackState = {
      isPlaying: true,
      currentAudio: audio,
      currentContentId: content.contentId
    };
  }

  stopCurrentPlayback(): void {
    if(this.playbackState.currentAudio) {
      this.playbackState.currentAudio.pause();
      this.playbackState.isPlaying = false;
    }
  }

  resetPlaybackState(): void {
    this.playbackState = {
      isPlaying: false,
      currentAudio: null,
      currentContentId: null
    };
  }

  isCurrentlyPlaying(contentId: string): boolean {
    return this.playbackState.isPlaying && this.playbackState.currentContentId === contentId;
  }

  togglePlayback(content: MusicContent): void {
    if (this.isCurrentlyPlaying(content.contentId)) {
      this.stopCurrentPlayback();
    }
    else {
      this.playContent(content);
    }
  }

  async getArtistName(artistId: string): Promise<string> {
    try {
      const params: GetArtistsParams = {"artistId": artistId}
      const response = await firstValueFrom(this.artistService.getArtists(params));
      if (response.count > 1) { 
        return 'Unknown';
      }
      return response.artists[0].name;
    }catch(error) {
      console.error(`Error fetching artist for artist with id: ${artistId} error: ${error}`);
      return 'Unknown';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sr-RS');
  }

    rateDialogVisible = false;
  subscribeDialogVisible = false;
  currentContent: any = null;
  selectedRating: number = 0;
  selectedSubscribeType: string = '';
  async openRateDialog(content: any) {
    console.log(content);
    this.currentContent = content;
    this.selectedRating = 0;

    // Proveri da li je pesma već ocenjena
    await this.checkCurrentSongRatingStatus(content);

    // Ako je već ocenjena, prikaži poruku i ne otvaraj dialog
    if (this.isSongRated(content.contentId)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Already Rated',
        detail: 'You have already rated this song.',
      });
      return;
    }

    this.rateDialogVisible = true;
  }

  // TypeScript kod - dodajte ova svojstva u klasu
  ratingsDialogVisible = false;
  selectedContentRatings: any[] = [];
  loadingRatings = false;

  ratedSongs = new Set<string>();

  isSongRated(songId: string): boolean {
    return this.ratedSongs.has(songId);
  }
  submitRating() {
    console.log(this.currentContent)
    this.ratingService
      .createRating({
        songId: this.currentContent.contentId,
        stars: this.selectedRating,
      })
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message,
          });
          if (this.selectedAlbum){
            this.loadContentForAlbum(this.selectedAlbum);
          }
          
        },
        error: (error) => {
          console.error(error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error,
          });
        },
      });
    this.rateDialogVisible = false;
  }
  showRatings(contentId: string) {
    this.loadingRatings = true;
    this.ratingsDialogVisible = true;

    this.ratingService.getRatings({ songId: contentId }).subscribe({
      next: (ratings) => {
        this.selectedContentRatings = ratings.ratings;
        this.loadingRatings = false;
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
        this.loadingRatings = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load ratings',
        });
      },
    });
  }
  // Dodajte ovu metodu u klasu
  getAverageRating(): string {
    if (this.selectedContentRatings.length === 0) return '0.0';
    const average =
      this.selectedContentRatings.reduce((sum, r) => sum + r.stars, 0) /
      this.selectedContentRatings.length;
    return average.toFixed(1);
  }
  // Dodajte ovu helper metodu za kreiranje array-a zvezda
  getStarsArray(rating: number): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, index) => index < rating);
  }

  // Dodajte ovu novu metodu
  async checkCurrentSongRatingStatus(content: any) {
    try {
      const isRated = await firstValueFrom(
        this.ratingService.isRated(content.contentId)
      );

      console.log('Rating response:', isRated);
      console.log('Rating type:', typeof isRated);

      if (isRated.is_rated) {
        this.ratedSongs.add(content.contentId);
      } else {
        this.ratedSongs.delete(content.contentId);
      }

      console.log('ratedSongs:', this.ratedSongs);
    } catch (error) {
      console.error('Error checking rating status:', error);
    }
  }

}