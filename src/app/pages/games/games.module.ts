import {NgModule} from '@angular/core';
import {GamesComponent} from './games.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from '@core/core.module';
import {GameComponent} from './game/game.component';

const routes: Routes = [
  { path: '', component: GamesComponent },
  { path: ':gameId', component: GameComponent }
];

@NgModule({
  declarations: [GamesComponent, GameComponent],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class GamesModule { }

