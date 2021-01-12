import {Route} from '@angular/router';
import {LoginComponent} from '../../pages/login/login.component';
import {HomeComponent} from '../../pages/home/home.component';

export interface IJbRoutes extends Route {
  data ?: {
    label         : string;   // Label of the page (to show on the menu / tab title)
    requireLogin  ?: boolean; // Whether the page is accessible without login (false). By default = true (requires login)
    permission    ?: string;  // Permission you need to access the page. If no present, no validation
  };
}


/******************************************************************************************
 * ADD MAIN ROUTES HERE
 * Routes here should be the first entry of a static route or lazy loaded module
 * Routes in lazy loaded modules can be defined within the modules (do not add them here)
 ******************************************************************************************/
export const routes: Array<IJbRoutes> = [
  { path: '', redirectTo: '/home', pathMatch: 'full', data: { label: '-' }},

  { path: 'login', component: LoginComponent, data: { label: 'page.label.login', requireLogin: false, } },
  { path: 'home',  component: HomeComponent,  data: { label: 'page.label.home', } },


  // Lazy loaded pages:

  { path: 'page1',
    loadChildren: () => import('src/app/pages/page1/page1.module').then(mod => mod.Page1Module),
    data: { label: 'page.label.xxxxx', permission: 'xxxxx' }
  },

]; // RouteEnd

