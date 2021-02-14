import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';

import { ProfileComponent } from './profile.component';

describe('NavbarComponent', () => {
  let component: ProfileComponent;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ ProfileComponent ],
    });
    component = TestBed.inject(ProfileComponent);
    store = TestBed.inject(Store);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
