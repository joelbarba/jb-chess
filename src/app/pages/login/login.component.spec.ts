import { TestBed } from '@angular/core/testing';
import { TestingModule } from 'src/testing-module';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ LoginComponent ],
      imports: [ TestingModule ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(LoginComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
