import {  TestBed } from '@angular/core/testing';
import { TestingModule } from 'src/testing-module';

import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let component: MenuComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TestingModule ],
      providers: [ MenuComponent ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(MenuComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
