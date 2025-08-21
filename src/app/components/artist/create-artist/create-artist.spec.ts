import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateArtist } from './create-artist';

describe('CreateArtist', () => {
  let component: CreateArtist;
  let fixture: ComponentFixture<CreateArtist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateArtist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateArtist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
