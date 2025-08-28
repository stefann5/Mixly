import { TestBed } from '@angular/core/testing';

import { MusicContentService } from './music-content-service';

describe('MusicContentService', () => {
  let service: MusicContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
