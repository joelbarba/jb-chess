import {NgModule} from '@angular/core';
import {GameComponent} from "./game.component";
import {RouterModule, Routes} from "@angular/router";
import {PieceSelectorModal} from "./piece-selector-modal/piece-selector.modal";
import {CoreModule} from "@core/core.module";


const routes: Routes = [
  { path: '', component: GameComponent },
  { path: ':gameId', data: { noLogin: true },
    children: [{ path: ':tokenId', data: { noLogin: true }, component: GameComponent }]
  }
];

@NgModule({
  declarations: [GameComponent, PieceSelectorModal],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ]
})
export class GameModule { }

