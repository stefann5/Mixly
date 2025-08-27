import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMusicContent } from './create-music-content';

describe('CreateMusicContent', () => {
  let component: CreateMusicContent;
  let fixture: ComponentFixture<CreateMusicContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMusicContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMusicContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
