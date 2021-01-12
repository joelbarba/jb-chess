import {NgModule} from '@angular/core';
import {HomeComponent} from './home.component';
import {CoreModule} from 'src/app/core/core.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [CoreModule]
})
export class HomeModule { }


