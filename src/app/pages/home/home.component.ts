import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public user: any = {};

  constructor() { }

  ngOnInit() { }

}


