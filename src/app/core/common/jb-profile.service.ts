import {Injectable} from '@angular/core';
import {ActivatedRoute,Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';
import {take} from 'rxjs/operators';
import {JbGrowlService} from 'jb-ui-lib';


@Injectable({ providedIn: 'root', })
export class JbProfileService {
  public isLoggedIn = false;
  public user;
  public change$;               // Every time the profile user changes
  public ready: Promise<any>;   // To wait before using DB access (routing guard waits for it)
  public permissions = ['any']; // Add here the profile's permissions
  public isPanelExp$ = new BehaviorSubject(false); // Profile panel is expanded

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private growl: JbGrowlService,
  ) {

    this.change$ = this.afAuth.user;

    this.afAuth.user.subscribe(user => {
      // console.log('afAuth.user', user);
      if (user && user.emailVerified) {
        this.isLoggedIn = true;
        this.user = {
          id            : user.uid,
          displayName   : user.displayName,
          email         : user.email,
          emailVerified : user.emailVerified,
          fireBaseUser  : user,
        };

      } else if (user && user.isAnonymous) {
        this.isLoggedIn = true;
        this.user = {
          id            : user.uid,
          displayName   : 'Guest',
          email         : 'none',
          emailVerified : false,
          fireBaseUser  : user,
        };

      } else {
        this.clearProfile();
      }
    });

    this.ready = Promise.all([
      this.afAuth.user.pipe(take(1)).toPromise(),
      this.afAuth.authState.pipe(take(1)).toPromise().then(() => {
        // if (!this.isLoggedIn) {
        //   console.warn('Not logged in');
        // } else {
        //   console.warn('Logged in');
        // }
      }),
    ]);

    this.ready.then(() => console.log('READY'));
  }

  private clearProfile() {
    this.isLoggedIn = false;
    this.user = undefined;
  }

  public login(email, pass) {
    return this.afAuth.signInWithEmailAndPassword(email, pass).then(data => {
      if (!data.user.emailVerified) { // User not activated (waiting for email click)
        this.growl.error('view.login.user_not_activated');
      } else {
        this.ready = this.afAuth.authState.pipe(take(1)).toPromise(); // refresh so router waits
        this.router.navigate(['home']);
      }
    }, (err) => this.growl.error(err.message));
  }

  public logout = () => {
    this.afAuth.signOut().then(() => {
      // window.location.href = '/login'; // Force page reload
    });
    this.router.navigate(['login']);
    this.clearProfile();
  }

  public updateProfile = (displayName) => {
    return this.user.fireBaseUser.updateProfile({ displayName });
  }

  public toggleProfile = (value?) => {
    this.isPanelExp$.pipe(take(1)).subscribe(isExp => {
      if (value === undefined) { value = !isExp; }
      if (value !== isExp) { this.isPanelExp$.next(value); }
    });
  }

  public anonymousLogin() {
    return this.afAuth.signInAnonymously().then(data => {
      // console.log('Anonymous correct', data);
    }).catch((error) => {
      // const errorCode = error.code;
      // const errorMessage = error.message;
    });
  }
}
