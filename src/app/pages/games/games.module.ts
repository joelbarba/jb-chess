import {NgModule} from '@angular/core';
import {GamesComponent} from './games.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from '@core/core.module';
import {GameComponent} from './game/game.component';
import {PieceSelectorModal} from "./game/piece-selector-modal/piece-selector.modal";

const routes: Routes = [
  { path: '', component: GamesComponent },
  { path: ':gameId', component: GameComponent }
];

@NgModule({
  declarations: [GamesComponent, GameComponent, PieceSelectorModal],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class GamesModule { }

