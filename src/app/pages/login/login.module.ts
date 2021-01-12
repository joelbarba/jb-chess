import {NgModule} from '@angular/core';
import {LoginComponent} from './login.component';
import {CoreModule} from 'src/app/core/core.module';

@NgModule({
  declarations: [LoginComponent],
  imports: [CoreModule]
})
export class LoginModule { }
