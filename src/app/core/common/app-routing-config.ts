import {Route} from '@angular/router';
import {LoginComponent} from '../../pages/login/login.component';
import {HomeComponent} from '../../pages/home/home.component';
import {SignInComponent} from '../../pages/login/sign-in/sign-in.component';
import {HostComponent} from "./host.component";

export interface IJbRoutes extends Route {
  data ?: {
    label        : string;  // Label of the page (to show on the menu / tab title)
    noLogin     ?: boolean; // Whether the page is accessible without login (true). By default = false (requires login)
    permission  ?: string;  // Permission you need to access the page. If no present, no validation
  };
}


/******************************************************************************************
 * ADD MAIN ROUTES HERE
 * Routes here should be the first entry of a static route or lazy loaded module
 * Routes in lazy loaded modules can be defined within the modules (do not add them here)
 ******************************************************************************************/
export const routes: Array<IJbRoutes> = [
  { path: '', component: HostComponent,  data: { label: 'page.label.login', noLogin: true, }},
  // { path: '', redirectTo: '/games', pathMatch: 'full', data: { label: '-' }},

  { path: 'login',      component: LoginComponent,  data: { label: 'page.label.login', noLogin: true, }},
  { path: 'login/sign', component: SignInComponent, data: { label: 'view.login.sign_in', noLogin: true, }},
  { path: 'home',       component: HomeComponent,   data: { label: 'page.label.home', permission: 'any' } },


  // Lazy loaded pages:

  { path: 'games', data: { label: 'view.games.title', permission: 'any' },
    loadChildren: () => import('src/app/pages/games/games.module').then(mod => mod.GamesModule),
  },
  { path: 'game', data: { label: 'view.games.title', permission: 'any', noLogin: true },
    loadChildren: () => import('src/app/pages/game/game.module').then(mod => mod.GameModule),
  },
  { path: 'page2', data: { label: 'page.label.xxxxx', permission: 'any' },
    loadChildren: () => import('src/app/pages/page2/page2.module').then(mod => mod.Page2Module),
  },

]; // RouteEnd

