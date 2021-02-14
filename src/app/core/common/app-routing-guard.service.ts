import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import {JbProfileService} from './jb-profile.service';

@Injectable({ providedIn: 'root' })
export class AppRoutingGuardService implements CanActivateChild {

  constructor(
    private router: Router,
    private profile: JbProfileService,
  ) { }

  canActivateChild(nextRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const route = nextRoute.routeConfig;

    if (route.data?.noLogin) { return true; }

    return this.profile.ready.then(() => {
      if (!this.profile.isLoggedIn) {
        return this.router.parseUrl('login'); // If not logged in, and route requires it --> Redirect to login

      } else { // Check permission to route
        if (!route.data?.permission || this.profile.permissions.includes(route.data?.permission)) {
          return true; // <-- All good, go ahead
        }

        console.error(`No permission '${route.data?.permission}' for route: ${route.path}`);
        if (nextRoute.routeConfig.path !== 'home') {
          return this.router.parseUrl('home'); // If not authorized --> Redirect to home
        }

        return false; // If not authorized to home, force a logout.
      }
    });
  }
}
