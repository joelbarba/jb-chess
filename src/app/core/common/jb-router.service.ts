import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {JbDefer, JbLoadingBarService} from 'jb-ui-lib';
import {
  ActivatedRoute,
  ActivationEnd,
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  RouteConfigLoadStart,
  Router
} from '@angular/router';


@Injectable({ providedIn: 'root', })
export class JbRouterService {
  public activeRoutes = [];     // Pointer to the last activated routes. [0] -> The lowest level
  public prevUrl: string;       // Previous visited route
  public currUrl: string;       // Current url
  public nextUrl: string;       // Keep the next url to route to from NavigationStart.url
  public lastPop: string;       // If using browser's back btn, keep the last popped state (in case of cancel)

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loadingBar: JbLoadingBarService,
    private ngbModal: NgbModal,
  ) {

    // When using the browser's back button
    window.onpopstate = (event) => this.lastPop = document.location.toString();

    let navDefer = new JbDefer(); // Promise to resolve on every navigation ends
    this.router.events.subscribe((routeEvent) => {
      // console.log(routeEvent);
      // Sequence of events on this.router.events (https://angular.io/api/router/Event)
      //  NavigationStart
      //    RouteConfigLoadStart <-- In case of a lazy loaded module
      //    RouteConfigLoadEnd
      //  RoutesRecognized
      //  GuardsCheckStart
      //  ChildActivationStart
      //  ActivationStart
      //  GuardsCheckEnd
      //  ResolveStart
      //  ResolveEnd
      //  ActivationEnd (lower level - grandchild)
      //  ChildActivationEnd
      //    ActivationEnd (mid level - child)
      //    ChildActivationEnd
      //      ActivationEnd (top level - root)
      //      ChildActivationEnd
      //  NavigationEnd / NavigationCancel
      //  Scroll

      if (routeEvent instanceof NavigationStart) {  // Detect navigation start and trigger loading bar
        // console.log('NavigationStart', routeEvent);
        this.activeRoutes = [];
        this.nextUrl = routeEvent.url;

        navDefer.resolve(); // Force a resolve in case the previous got stuck
        navDefer = new JbDefer();
        this.loadingBar.run(navDefer.promise, { delayTime: 200 });  // Run loading spinner until the navigation is over
      }

      // This is only for lazy loaded routes
      if (routeEvent instanceof RouteConfigLoadStart) {
        this.activeRoutes.push({ ...routeEvent.route, isLazy: true });
      }

      // if (routeEvent instanceof ActivationStart) {
      //   const flatRoutes = this.getNestedRoute(routeEvent.snapshot);
      //   console.log('Activated Routes List', flatRoutes);
      // }


      if (routeEvent instanceof ActivationEnd) {
        this.activeRoutes.push(routeEvent.snapshot.routeConfig);  // Keep track of the activated routes
        // if (routeEvent.snapshot.routeConfig.path === '') { }
        // if (routeEvent.snapshot.routeConfig.path === '**') { } // Wildcard (no route was match - 404)
      }


      if (routeEvent instanceof NavigationCancel) {
        this.ngbModal.dismissAll('route cancel');
        if (this.lastPop) { this.lastPop = null; }
        setTimeout(() => { navDefer.resolve(); }, 50);
      }

      if (routeEvent instanceof NavigationEnd) {
        // console.log('NavigationEnd', routeEvent);
        this.prevUrl = this.currUrl;
        this.currUrl = routeEvent.url;
        this.lastPop = null;

        // When navigation is done, do not stop the loading immediately. Wait a little.
        // There will be (most likely) data to load in the accessed page that will automatically trigger the loading bar again.
        // To create a smooth effect, give some time for the page to trigger the web api requests and chain new promises into the
        // loading bar to resolve once everything is ready
        setTimeout(() => { navDefer.resolve(); }, 50);
      }

    });
  }


  private getNestedRoute = (route): Array<any> => {
    if (!route.parent) {
      return [route];
    } else {
      const nestedRoutes = this.getNestedRoute(route.parent);
      nestedRoutes.push(route);
      return nestedRoutes;
    }
  };

  // It returns the lowest level route that was activated in the last navigation
  public getLastRoute = () => {
    if (!!this.activeRoutes && this.activeRoutes.length >= 1) {
      return this.activeRoutes[0];
    } else {
      return null;
    }
  };

  // Go back to the previous route (emulate browser history back)
  // If backUrl provided, go back only if coming from there. If not, go to backUrl
  public goBack = (backUrl?) => {
    if (!backUrl) { // Just go back in history
      return this.router.navigateByUrl(this.prevUrl || '/');
    }

    if (!!this.prevUrl && this.prevUrl.split('?')[0] === backUrl) {
      return this.router.navigateByUrl(this.prevUrl); // prevUrl may contain some query params to preserve

    } else { // Force going back to the provided url (we came from somewhere else)
      return this.router.navigate([backUrl]);
    }
  };

  public comingFromChild = () => {
    const prevUrl = (this.prevUrl || '').split('?')[0];
    const currUrl = (this.currUrl || '').split('?')[0];
    return prevUrl.indexOf(currUrl) >= 0;
  }

}
