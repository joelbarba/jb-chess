import {NgModule} from '@angular/core';
import {LoginComponent} from './login.component';
import {CoreModule} from 'src/app/core/core.module';
import {SignInComponent} from './sign-in/sign-in.component';

@NgModule({
  declarations: [LoginComponent, SignInComponent],
  imports: [
    CoreModule,
  ]
})
export class LoginModule { }
