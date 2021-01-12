import { NgModule} from '@angular/core';
import { RouterModule, Routes} from '@angular/router';
import { PageNotFoundComponent } from 'src/app/shell/page-not-found/page-not-found.component';
import { routes } from './app-routing-config';
import { AppRoutingGuardService } from './app-routing-guard.service';


// Wrap all routes into a main single route where to apply the global guards
const mainRoute: Routes = [
  { path: '',
    children: [
      ...routes,

      // Wildcard (should be always the last route):
      { path: '**', component: PageNotFoundComponent, data: { label: 'page.label.pageNotFound', requireLogin: false } }
    ],
    canActivateChild: [AppRoutingGuardService],
    // canLoad       : [() => { console.log('loading route'); return true; }],
    // resolve       : [() => { console.log('resolving route'); return true; }],
    // canDeactivate : [() => { console.log('deactivating route'); return true; }],
    // canActivate   : [() => { console.log('activating route'); return true; }],
  },
];

// ---------------------------------------------
@NgModule({
  imports: [
    RouterModule.forRoot(mainRoute),
    // RouterModule.forRoot(mainRoute, { onSameUrlNavigation: 'reload' }) // doesn't work! (https://github.com/angular/angular/issues/31843)
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
