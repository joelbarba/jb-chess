import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {NavbarComponent} from './navbar/navbar.component';
import {MenuComponent} from './menu/menu.component';
import {FooterComponent} from './footer/footer.component';
import {CoreModule} from 'src/app/core/core.module';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {LoginModule} from '../pages/login/login.module';
import {HomeModule} from '../pages/home/home.module';
import {ProfileComponent} from './profile/profile.component';


@NgModule({
  declarations: [
    NavbarComponent,
    MenuComponent,
    FooterComponent,
    PageNotFoundComponent,
    ProfileComponent,
  ],
  imports: [
    CoreModule,

    // Static pages (not lazy loaded)
    LoginModule,
    HomeModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    NavbarComponent,
    MenuComponent,
    FooterComponent,
    ProfileComponent,
    LoginModule,
    HomeModule,
  ],
})
export class ShellModule { }
