import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';


@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public username = '';
  public password = '';
  public selLang: { code, default_language, name };  // Selected locale
  public loggingPromise;  // Promise to disable the form while logging
  public forceBtnEnabled = false;

  constructor(
    private router: Router,
  ) {
  }

  ngOnInit() {

    // If logged in, redirect to dashboard directly
    // this.oauth.getProfilePromise().then(() => {
    //   if (!!this.oauth.profile) { this.router.navigate(['/home']); }
    // });

    // this.jbTranslate.languagesPromise.then(langs => {
    //   this.selLang = langs.getByProp('code', this.translate.currentLang);
    // });
  }

  public logIn = ($event) => {
    $event.stopPropagation();
    $event.preventDefault(true);
    // this.loggingPromise = this.oauth.requestLogin(this.username, this.password).then(() => {
    //   this.router.navigate(['/home']);
    // }, (err) => { this.growl.error('Invalid user or password'); });
  };

}
