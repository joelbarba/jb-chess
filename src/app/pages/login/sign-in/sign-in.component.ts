import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {JbConfirmService, JbGrowlService} from 'jb-ui-lib';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  public email = '';
  public password = '';
  public password2 = '';

  constructor(
    private confirm: JbConfirmService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private growl: JbGrowlService,
  ) {
  }

  ngOnInit() {}

  signIn() {
    this.afAuth.createUserWithEmailAndPassword(this.email, this.password).then(userCredential => {
      userCredential.user.updateProfile({ displayName: this.email }).then(() => {
        const settings = { url: `${environment.url}/login`, handleCodeInApp: true };
        userCredential.user.sendEmailVerification(settings).then(() => {
          this.confirm.open({
            title: 'view.login.sign_in',
            text: 'view.sign.sent_msg',
            yesButtonText: 'view.common.ok',
            showCancel: false,
          }).then(() => {
            this.router.navigate(['/login']);
          })
        });
      });
    }, err => this.growl.error(err.message));
  }


}
