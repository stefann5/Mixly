import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMusicContent } from './view-music-content';

describe('ViewMusicContent', () => {
  let component: ViewMusicContent;
  let fixture: ComponentFixture<ViewMusicContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMusicContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewMusicContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
