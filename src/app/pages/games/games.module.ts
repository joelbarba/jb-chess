import {NgModule} from '@angular/core';
import {GamesComponent} from './games.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from '@core/core.module';

const routes: Routes = [
  { path: '', component: GamesComponent }
];

@NgModule({
  declarations: [GamesComponent],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class GamesModule { }

