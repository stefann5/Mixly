import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMusicContent } from './update-music-content';

describe('UpdateMusicContent', () => {
  let component: UpdateMusicContent;
  let fixture: ComponentFixture<UpdateMusicContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateMusicContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateMusicContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
