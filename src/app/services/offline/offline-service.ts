import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../globals';
import { from, Observable } from 'rxjs';

export interface DownloadedFile {
  audioURL: string;
  coverImageURL?: string;
}

export interface CachedSong {
  contentId: string;
  title: string;
  artistName?: string;
  audioBlob: Blob;
  coverImageBlob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly URL = `${API_URL}/offline/mark`;
  private readonly DB_NAME = 'MusicAppOfflineDB';
  private readonly DB_VERSION = 1;
  private readonly AUDIO_STORE = 'audioFiles';
  private readonly COVER_IMAGE_STORE = 'coverImages';
  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) { 
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.AUDIO_STORE)) {
          const audioStore = db.createObjectStore(this.AUDIO_STORE, { keyPath: 'contentId' });
          audioStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        if(!db.objectStoreNames.contains(this.COVER_IMAGE_STORE)) {
          const coverImageStore = db.createObjectStore(this.COVER_IMAGE_STORE, { keyPath: 'contentId' });
        }
      }
    });
  }

  downloadForOffline(contentId: string, streamURL: string, title: string, artistName?: string, coverImageUrl?: string): Observable<DownloadedFile> {
    return from(this.downloadAndCache(contentId, streamURL, title, artistName, coverImageUrl));
  }

  private async downloadAndCache(contentId: string, streamURL: string, title: string, artistName?: string, coverImageUrl?: string): Promise<DownloadedFile> {
    try {
      await this.initDB();

      const audioResponse = await fetch(streamURL);
      if(!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
      }
      const audioBlob = await audioResponse.blob();

      let coverImageBlob: Blob | undefined;
      if (coverImageUrl) {
        try {
          const coverImageResponse = await fetch(coverImageUrl);
          if (coverImageResponse.ok) {
            coverImageBlob = await coverImageResponse.blob();
          }
        }catch(error) {
          console.warn('Failed to download cover image: ', error);
        }
      }

      await this.storeInDB(contentId, {
        contentId,
        title,
        artistName,
        audioBlob,
        coverImageBlob
      });

      const audioURL = URL.createObjectURL(audioBlob);
      const coverImageURL = coverImageBlob ? URL.createObjectURL(coverImageBlob) : undefined;

      return { audioURL, coverImageURL };
    }
    catch(error) {
      throw new Error(`Download failed: ${error}`);
    }
  }

  private async storeInDB(contentId: string, cachedSong: CachedSong): Promise<void> {
    return new Promise((resolve, reject) => {
      if(!this.db) {
        reject(new Error('Database not initalized'));
        return;
      }

      const transaction = this.db.transaction([this.AUDIO_STORE, this.COVER_IMAGE_STORE], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const audioStore = transaction.objectStore(this.AUDIO_STORE);
      audioStore.put(cachedSong);

      if (cachedSong.coverImageBlob) {
        const coverImageStore = transaction.objectStore(this.COVER_IMAGE_STORE);
        coverImageStore.put({
          contentId,
          blob: cachedSong.coverImageBlob
        });
      }
    });
  }

  async isAvailableOffline(contentId: string): Promise<boolean> {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        if(!this.db) {
          resolve(false);
          return;
        }

        const transaction = this.db.transaction([this.AUDIO_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDIO_STORE);
        const request = store.get(contentId);

        request.onerror = () => resolve(false);
        request.onsuccess = () => resolve(!!request.result);
      }); 
    }catch {
      return false;
    }
  }

  async getOfflineContent(contentId: string): Promise<DownloadedFile | null> {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        if(!this.db) {
          resolve(null);
          return;
        }

        const transaction = this.db.transaction([this.AUDIO_STORE, this.COVER_IMAGE_STORE], 'readonly');
        const audioStore = transaction.objectStore(this.AUDIO_STORE);
        const coverImageStore = transaction.objectStore(this.COVER_IMAGE_STORE);

        const audioRequest = audioStore.get(contentId);
        const coverimageRequest = coverImageStore.get(contentId);

        let audioResult: CachedSong | null = null;
        let coverImageResult: any = null;
        let completedRequests = 0;

        const checkComplete = () => {
          completedRequests++;
          if(completedRequests === 2) {
            if (audioResult) {
              const audioURL = URL.createObjectURL(audioResult.audioBlob);
              const coverImageURL = coverImageResult ? URL.createObjectURL(coverImageResult.blob) : undefined;
              resolve({ audioURL, coverImageURL });
            } else {
              resolve(null);
            }
          }
        };

        audioRequest.onerror = () => { audioResult = null; checkComplete(); };
        audioRequest.onsuccess = () => { audioResult = audioRequest.result; checkComplete(); };

        coverimageRequest.onerror = () => { coverImageResult = null; checkComplete(); };
        coverimageRequest.onsuccess = () => { coverImageResult = coverimageRequest.result; checkComplete(); };
      });
    } catch {
      return null;
    }
  }

  async getAllOfflineContent(): Promise<CachedSong[]> {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        if(!this.db) {
          return resolve([]);
        }

        const transaction = this.db.transaction([this.AUDIO_STORE], 'readonly');
        const store = transaction.objectStore(this.AUDIO_STORE);
        const request = store.getAll();

        request.onerror = () => resolve([]);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch {
      return [];
    }
  }

  downloadToFileSystem(contentId: string, filename: string, audioURL: string): void {
    fetch(audioURL)
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch(error => {
      console.error('Download failed: ', error);
      throw new Error('Failed to download file');
    });
  }
}
