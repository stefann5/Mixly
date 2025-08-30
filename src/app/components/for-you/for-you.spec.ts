import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForYou } from './for-you';

describe('ForYou', () => {
  let component: ForYou;
  let fixture: ComponentFixture<ForYou>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForYou]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForYou);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
