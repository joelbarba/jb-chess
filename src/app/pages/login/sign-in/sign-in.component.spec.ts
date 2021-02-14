import { TestBed } from '@angular/core/testing';
import { TestingModule } from 'src/testing-module';

import { SignInComponent } from './sign-in.component';

describe('LoginComponent', () => {
  let component: SignInComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ SignInComponent ],
      imports: [ TestingModule ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(SignInComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
