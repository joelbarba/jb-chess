import { TestBed } from '@angular/core/testing';

import { TestingModule } from 'src/testing-module';
import { PageNotFoundComponent } from './page-not-found.component';

describe('PageNotFoundComponent', () => {
  let component: PageNotFoundComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TestingModule ],
      providers: [ PageNotFoundComponent ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(PageNotFoundComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
