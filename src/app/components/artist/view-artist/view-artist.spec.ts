import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewArtists } from './view-artist';

describe('ViewArtist', () => {
  let component: ViewArtists;
  let fixture: ComponentFixture<ViewArtists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewArtists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewArtists);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
