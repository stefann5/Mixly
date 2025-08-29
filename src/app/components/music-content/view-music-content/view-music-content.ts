import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MusicContentService, MusicContent } from '../../../services/music-content/music-content-service';
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
import { ArtistService, GetArtistsParams } from '../../../services/artists/artist-service';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../../../auth/service/auth-service';
import { TranscriptionService, TranscriptionResponse } from '../../../services/transcription/transcription-service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TabsModule } from 'primeng/tabs';

interface PlaybackState {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  currentContentId: string | null;
}

interface TranscriptionState {
  [contentId: string]: {
    data?: TranscriptionResponse;
    loading: boolean;
    error?: string;
    htmlContent?: SafeHtml;
  };
}

@Component({
  selector: 'app-view-music-content',
  imports: [ButtonModule, TooltipModule, ProgressSpinnerModule, MessageModule, CardModule, CommonModule, ChipModule, DividerModule, ToastModule, DialogModule, ImageModule, TabsModule],
  templateUrl: './view-music-content.html',
  styleUrl: './view-music-content.scss',
  providers: [MessageService]
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
    currentContentId: null
  };

  transcriptionStates: TranscriptionState = {};

  constructor(
    private router: Router, 
    private messageService: MessageService,
    private artistService: ArtistService,
    private musicContentService: MusicContentService,
    private authService: AuthService,
    private transcriptionService: TranscriptionService,
    private sanitizer: DomSanitizer) {}

    ngOnInit(): void {
        this.loadMusicContent();
    }

    async loadMusicContent(loadMore = false): Promise<void> {
      if(loadMore) {
        this.isLoadingMore = true;
      } else {
        this.isLoading = true;
        this.musicContent = [];
      }

      this.musicContentService.getAllMusicContent().subscribe({
        next: async (response) => {
          if(loadMore) {
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
            detail: this.errorMessage
          });
        }
      });
    }

    navigateToCreate(): void {
      this.router.navigate(['/dashboard/music-content/create']);
    }

    viewSongDetails(song: MusicContent): void {
      this.selectedContent = song;
      this.displayDialog = true;
      // Load transcription when dialog opens
      this.loadTranscription(song.contentId);
    }

    editSong(song: MusicContent): void {
      this.router.navigate(['/dashboard/music-content/update', song.contentId]);
    }

    isAdmin(): boolean {
      return this.authService.isAdmin();
    }

    deleteSong(song: MusicContent): void {
      if(confirm(`Are you sure you want to delete "${song.title}"?`)) {
        this.musicContentService.deleteMusicContent(song.contentId).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message
            });
            this.loadMusicContent();
          },
          error: (error) => {
            console.error(error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error
            });
          }
        });
      }
    }

    loadMoreMusicContent(): void {
      this.loadMusicContent(true);
    }

    async getArtist(artistId: string): Promise<string> {
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

    getAlbum(content: MusicContent): string {
      return content.album || 'single';
    }

    getCoverImageUrl(content: MusicContent): string {
      return content.coverImageUrl || 'assets/images/default-cover.jpg';
    }

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

      // Load transcription when playing starts
      this.loadTranscription(content.contentId);
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

    // Transcription methods
    loadTranscription(contentId: string): void {
      // Don't reload if already loading or loaded
      if (this.transcriptionStates[contentId]) {
        return;
      }

      this.transcriptionStates[contentId] = {
        loading: true
      };

      this.transcriptionService.getTranscription(contentId, 'html').subscribe({
        next: (response) => {
          this.transcriptionStates[contentId] = {
            loading: false,
            data: response
          };

          // Sanitize HTML content if available
          if (response.html) {
            this.transcriptionStates[contentId].htmlContent = this.sanitizer.bypassSecurityTrustHtml(response.html);
          }

          // Inject CSS if provided
          if (response.css) {
            this.injectTranscriptionStyles(response.css);
          }
        },
        error: (error) => {
          console.error('Error loading transcription:', error);
          this.transcriptionStates[contentId] = {
            loading: false,
            error: 'Failed to load transcription'
          };
        }
      });
    }

    getTranscriptionState(contentId: string) {
      return this.transcriptionStates[contentId] || { loading: false };
    }

    hasTranscription(contentId: string): boolean {
      const state = this.transcriptionStates[contentId];
      return state?.data?.status === 'COMPLETED' && !!state.data.html;
    }

    isTranscriptionLoading(contentId: string): boolean {
      return this.transcriptionStates[contentId]?.loading || false;
    }

    getTranscriptionError(contentId: string): string | undefined {
      return this.transcriptionStates[contentId]?.error;
    }

    getTranscriptionHtml(contentId: string): SafeHtml | undefined {
      return this.transcriptionStates[contentId]?.htmlContent;
    }

    private injectTranscriptionStyles(css: string): void {
      // Check if styles are already injected
      if (document.getElementById('transcription-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'transcription-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    retryTranscription(contentId: string): void {
      // Clear existing state and retry
      delete this.transcriptionStates[contentId];
      this.loadTranscription(contentId);
    }
}