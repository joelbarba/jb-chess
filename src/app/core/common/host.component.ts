import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({ selector: 'host-page', template: '<h1>Redirecting...</h1>' })
export class HostComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const gameId = this.route.snapshot.queryParams?.gameId;
    const token = this.route.snapshot.queryParams?.token;

    if (gameId && token) {
      console.log('Redirecting to game', this.route.snapshot.queryParams);
      this.router.navigate(['/game/', gameId, token]);
    } else {
      this.router.navigate(['/home']);
    }
  }
}

/*
http:\\127.0.0.1:4200\game\d4WJ2l5GNAO456nKxhiD\wXFQhqwQm9Rta2AHhMvD
http:\\127.0.0.1:4200\game\d4WJ2l5GNAO456nKxhiD\ksHtFkGrQHSkDpKp03cA

http://127.0.0.1:4200/?gameId=d4WJ2l5GNAO456nKxhiD&token=wXFQhqwQm9Rta2AHhMvD
http://127.0.0.1:4200/?gameId=d4WJ2l5GNAO456nKxhiD&token=ksHtFkGrQHSkDpKp03cA
 */
