import {NgModule} from '@angular/core';
import {Page2Component} from './page2.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from '../../core/core.module';

const routes: Routes = [
  { path: '', component: Page2Component }
];

@NgModule({
  declarations: [Page2Component],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class Page2Module { }

