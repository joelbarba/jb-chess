import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivationEnd, Router} from '@angular/router';
import {SubSink} from 'subsink';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  public menuEntries = [
    { id: 1, path: 'home',  icon: 'icon-home',    isActive: false },
    { id: 2, path: 'games', icon: 'icon-finish',  isActive: false },
    { id: 3, path: 'page2', icon: 'icon-user',    isActive: false },
    // ...
    // ...
  ];

  constructor(
    private router: Router,
  ) {}

  ngOnInit() {

    // Listen to routing changes and mark the active route on the menu
    this.subs.add(this.router.events.pipe(
      filter(event => event instanceof ActivationEnd),
      filter((event: ActivationEnd) => event.snapshot.routeConfig.path !== ''),  // skip root routes
    ).subscribe((event: ActivationEnd) => {
      this.menuEntries.forEach(entry => entry.isActive = entry.path === event.snapshot.routeConfig.path);
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
