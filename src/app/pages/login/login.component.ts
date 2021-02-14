import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {JbGrowlService} from 'jb-ui-lib';
import {JbProfileService} from '../../core/common/jb-profile.service';
import {AngularFirestore} from '@angular/fire/firestore';


@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public email = '';
  public password = '';
  public loggingPromise;  // Promise to disable the form while logging

  constructor(
    public profile: JbProfileService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private growl: JbGrowlService,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {

    // If logged in, redirect to dashboard directly
    this.profile.ready.then(() => {
      if (this.profile.isLoggedIn) { this.router.navigate(['/home']); }
    })
  }


}
