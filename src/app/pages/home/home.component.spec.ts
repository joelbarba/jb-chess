import { TestBed } from '@angular/core/testing';
import { TestingModule } from 'src/testing-module';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ HomeComponent ],
      imports: [ TestingModule ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(HomeComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
