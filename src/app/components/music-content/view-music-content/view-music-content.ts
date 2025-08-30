import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  MusicContentService,
  MusicContent,
} from '../../../services/music-content/music-content-service';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import {
  ArtistService,
  GetArtistsParams,
} from '../../../services/artists/artist-service';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../../../auth/service/auth-service';
import { RadioButton } from 'primeng/radiobutton';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { RatingService } from '../../../services/rating/rating-service';
import {
  CreateSubscriptionRequest,
  SubscriptionsService,
} from '../../../services/subscriptions/subscription-service';
interface PlaybackState {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  currentContentId: string | null;
}

@Component({
  selector: 'app-view-music-content',
  imports: [
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    MessageModule,
    CardModule,
    CommonModule,
    ChipModule,
    DividerModule,
    ToastModule,
    DialogModule,
    ImageModule,
    RadioButton,
    FormsModule,
    RatingModule,
  ],
  templateUrl: './view-music-content.html',
  styleUrl: './view-music-content.scss',
  providers: [MessageService],
})
export class ViewMusicContent implements OnInit {
  musicContent: MusicContent[] = [];
  isLoading = false;
  isLoadingMore = false;
  errorMessage = '';
  hasMore = false;
  lastKey = '';

  displayDialog = false;
  selectedContent: MusicContent | null = null;
  playbackState: PlaybackState = {
    isPlaying: false,
    currentAudio: null,
    currentContentId: null,
  };

  constructor(
    private router: Router,
    private messageService: MessageService,
    private artistService: ArtistService,
    private musicContentService: MusicContentService,
    private authService: AuthService,
    private ratingService: RatingService,
    private subscriptionService: SubscriptionsService
  ) {}

  ngOnInit(): void {
    this.loadMusicContent();
  }

  async loadMusicContent(loadMore = false): Promise<void> {
    if (loadMore) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
      this.musicContent = [];
    }
    this.musicContentService.getAllMusicContent().subscribe({
      next: async (response) => {
        if (loadMore) {
          this.musicContent = [...this.musicContent, ...response.content];
        } else {
          this.musicContent = response.content;
        }
        for (const song of this.musicContent) {
          song.artistName = await this.getArtist(song.artistId);
        }

        this.hasMore = false;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage,
        });
      },
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/dashboard/music-content/create']);
  }

  viewSongDetails(song: MusicContent): void {
    this.selectedContent = song;
    this.displayDialog = true;
  }

  editSong(song: MusicContent): void {
    this.router.navigate(['/dashboard/music-content/update', song.contentId]);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  deleteSong(song: MusicContent): void {
    if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
      this.musicContentService.deleteMusicContent(song.contentId).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message,
          });
          this.loadMusicContent();
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
    }
  }

  loadMoreMusicContent(): void {
    this.loadMusicContent(true);
  }

  async getArtist(artistId: string): Promise<string> {
    try {
      const params: GetArtistsParams = { artistId: artistId };
      const response = await firstValueFrom(
        this.artistService.getArtists(params)
      );
      if (response.count > 1) {
        return 'Unknown';
      }
      return response.artists[0].name;
    } catch (error) {
      console.error(
        `Error fetching artist for artist with id: ${artistId} error: ${error}`
      );
      return 'Unknown';
    }
  }

  getAlbum(content: MusicContent): string {
    return content.album || 'single';
  }

  getCoverImageUrl(content: MusicContent): string {
    return content.coverImageUrl || 'assets/images/default-cover.jpg';
  }

playContent(content: MusicContent): void {
  // prvo dodaj u istoriju
  this.musicContentService.addToHistory(content.contentId).subscribe({
    next: () => {
      this.stopCurrentPlayback();

      if (content.contentId === this.playbackState.currentContentId) {
        this.playbackState.currentAudio?.play();
        this.playbackState.isPlaying = true;
        return;
      }

      const audio = new Audio(content.streamURL);

      audio.addEventListener('canplay', () => {
        audio.play().catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to play audio',
          });
        });
      });

      audio.addEventListener('ended', () => {
        this.resetPlaybackState();
      });

      audio.addEventListener('error', () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load audio stream',
        });
        this.resetPlaybackState();
      });

      this.playbackState = {
        isPlaying: true,
        currentAudio: audio,
        currentContentId: content.contentId,
      };
    },
    error: (err) => {
      // ako padne upis istorije, svejedno puštamo pesmu
      console.error('Failed to add to history', err);

      this.stopCurrentPlayback();

      if (content.contentId === this.playbackState.currentContentId) {
        this.playbackState.currentAudio?.play();
        this.playbackState.isPlaying = true;
        return;
      }

      const audio = new Audio(content.streamURL);

      audio.addEventListener('canplay', () => {
        audio.play().catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to play audio',
          });
        });
      });

      audio.addEventListener('ended', () => {
        this.resetPlaybackState();
      });

      audio.addEventListener('error', () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load audio stream',
        });
        this.resetPlaybackState();
      });

      this.playbackState = {
        isPlaying: true,
        currentAudio: audio,
        currentContentId: content.contentId,
      };
    },
  });
}

  // playContent(content: MusicContent): void {
  //   this.stopCurrentPlayback();
  //   if (content.contentId === this.playbackState.currentContentId) {
  //     this.playbackState.currentAudio?.play();
  //     this.playbackState.isPlaying = true;
  //     return;
  //   }
  //   const audio = new Audio(content.streamURL);

  //   audio.addEventListener('canplay', () => {
  //     audio.play().catch((error) => {
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'Failed to play audio',
  //       });
  //     });
  //   });

  //   audio.addEventListener('ended', () => {
  //     this.resetPlaybackState();
  //   });

  //   audio.addEventListener('error', (e) => {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: 'Failed to load audio stream',
  //     });
  //     this.resetPlaybackState();
  //   });

  //   this.playbackState = {
  //     isPlaying: true,
  //     currentAudio: audio,
  //     currentContentId: content.contentId,
  //   };
  // }

  stopCurrentPlayback(): void {
    if (this.playbackState.currentAudio) {
      this.playbackState.currentAudio.pause();
      this.playbackState.isPlaying = false;
    }
  }

  resetPlaybackState(): void {
    this.playbackState = {
      isPlaying: false,
      currentAudio: null,
      currentContentId: null,
    };
  }

  isCurrentlyPlaying(contentId: string): boolean {
    return (
      this.playbackState.isPlaying &&
      this.playbackState.currentContentId === contentId
    );
  }

  togglePlayback(content: MusicContent): void {
    if (this.isCurrentlyPlaying(content.contentId)) {
      this.stopCurrentPlayback();
    } else {
      this.playContent(content);
    }
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
      this.selectedContentRatings.reduce((sum, r) => sum + Number(r.stars), 0) /
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
      const currentUsername = this.authService.getCurrentUser()?.username;
      if (!currentUsername) return;

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

  async openSubscribeDialog(content: any) {
    this.currentContent = content;
    this.selectedSubscribeType = '';

    // Proveri subscription status za artist i genre
    await this.checkCurrentContentSubscriptionStatus(content);

    this.subscribeDialogVisible = true;
  }
  subscribedArtists = new Set<string>(); // Set ID-jeva subscribed artista
  subscribedGenres = new Set<string>();
  // Dodajte ove helper funkcije
  isArtistSubscribed(artistId: string): boolean {
    return this.subscribedArtists.has(artistId);
  }

  isGenreSubscribed(genre: string): boolean {
    return this.subscribedGenres.has(genre);
  }
  ratedSongs = new Set<string>();
  // Dodajte ovu novu metodu
  async checkCurrentContentSubscriptionStatus(content: any) {
    try {
      // Proveri da li je subscribed na artista
      const artistSubscription = await firstValueFrom(
        this.subscriptionService.isSubscribed(
          'ARTIST',
          content.artistId,
          content.artistName
        )
      );

      if (artistSubscription.is_subscribed) {
        this.subscribedArtists.add(content.artistId);
      } else {
        this.subscribedArtists.delete(content.artistId);
      }

      // Proveri da li je subscribed na žanr (samo targetName)
      const genreSubscription = await firstValueFrom(
        this.subscriptionService.isSubscribed('GENRE', null, content.genre)
      );

      if (genreSubscription.is_subscribed) {
        this.subscribedGenres.add(content.genre);
      } else {
        this.subscribedGenres.delete(content.genre);
      }
    } catch (error) {
      console.error(
        'Error checking current content subscription status:',
        error
      );
    }
  }
  // Dodajte ovu helper funkciju
  isSongRated(songId: string): boolean {
    return this.ratedSongs.has(songId);
  }
  submitRating() {
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
          this.loadMusicContent();
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

  submitSubscribe() {
    if (this.selectedSubscribeType == 'ARTIST') {
      this.subscriptionService
        .createSubscription({
          subscriptionType: this.selectedSubscribeType,
          targetId: this.currentContent.artistId,
          targetName: this.currentContent.artistName,
        })
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message,
            });
            this.loadMusicContent();
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
    } else {
      this.subscriptionService
        .createSubscription({
          subscriptionType: this.selectedSubscribeType,
          targetId: 'undefined',
          targetName: this.currentContent.genre,
        })
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message,
            });
            this.loadMusicContent();
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
    }

    this.subscribeDialogVisible = false;
  }
}
