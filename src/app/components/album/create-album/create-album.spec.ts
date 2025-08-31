import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAlbum } from './create-album';

describe('CreateAlbum', () => {
  let component: CreateAlbum;
  let fixture: ComponentFixture<CreateAlbum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAlbum]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAlbum);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
