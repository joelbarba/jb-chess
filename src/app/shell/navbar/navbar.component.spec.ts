import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { TestScheduler } from 'rxjs/testing';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let store: Store;

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TestingModule ],
      providers: [ NavbarComponent ],
    });
  });

  beforeEach(() => {
    component = TestBed.inject(NavbarComponent);
    store = TestBed.inject(Store);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('refreshProfileAvatar$', () => {
    it('should notify of a change in the avatar', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const avatarId$ = cold('--a-a-a-b--');
        const subs =           '---^------!';
        const expected =       '--------a--';

        avatarId$.subscribe(_ => store.reset({ app: { profile: { avatar_id: _ } } }));
        expectObservable(component.refreshProfileAvatar$, subs).toBe(expected, [ void 0 ]);
      });
    });
  });
});
