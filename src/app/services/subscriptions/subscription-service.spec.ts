import { TestBed } from '@angular/core/testing';

import { SubscriptionsService } from './subscription-service';

describe('Subscriptions', () => {
  let service: SubscriptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubscriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
