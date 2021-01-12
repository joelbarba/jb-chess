import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubSink} from 'subsink';
import {ActivationEnd, Router, RouterEvent} from '@angular/router';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  public menuEntries = [
    { id: 1, path: 'home',  icon: 'icon-home', isActive: false },
    { id: 2, path: 'page1', icon: 'icon-info', isActive: false },
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
