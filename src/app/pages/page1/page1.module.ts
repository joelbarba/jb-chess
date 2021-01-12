import {NgModule} from '@angular/core';
import {Page1Component} from './page1.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from "../../core/core.module";

const routes: Routes = [
  { path: '', component: Page1Component }
];

@NgModule({
  declarations: [Page1Component],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class Page1Module { }

