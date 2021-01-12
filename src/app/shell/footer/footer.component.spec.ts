import { TestBed } from '@angular/core/testing';
import { TestingModule } from 'src/testing-module';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ FooterComponent ],
      imports: [ TestingModule ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(FooterComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
