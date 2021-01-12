import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AppRoutingGuardService implements CanActivateChild {

  constructor(
    private router: Router,
  ) { }

  canActivateChild(nextRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const route = nextRoute.routeConfig;

    if (!route.data?.requireLogin) { return true; }

    // if (this.store.profile) {
    //   if (nextRoute.routeConfig.path !== 'home') {
    //     return this.router.parseUrl('home'); // If logged in, but not authorized --> Redirect to home
    //   } else {
    //     return false; // If not authorized to home, force a logout.
    //   }
    // }
    // if (!this.store.profile) {
    //   return this.router.parseUrl('login'); // If not logged in, and route requires being logged in --> Redirect to login
    // }

    return true;
  }
}
