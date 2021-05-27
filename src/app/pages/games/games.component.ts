import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {JbProfileService} from '@core/common/jb-profile.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {JbGrowlService, JbListHandler, ListStatus} from 'jb-ui-lib';
import {EGameStatus, StoreService} from '@core/store/store.service';
import {strToDate} from '@core/core-lib/helpers';
import {Router} from "@angular/router";

@Component({
  selector: 'jb-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit, OnDestroy {
  public status = ListStatus;
  public sub;
  public REQUESTED = EGameStatus.REQUESTED;

  public gamesList = new JbListHandler({
    listName: 'games-list',
    filterFields: ['playerName1', 'playerName2'],
    orderFields: ['reqTime'],
    rowsPerPage: 10,
    // data$: this.store.games$,
    // status$: of(this.status.LOADED)
  });

  constructor(
    private profile: JbProfileService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private growl: JbGrowlService,
    public store: StoreService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.sub = this.store.games$.subscribe(games => {
      this.gamesList.load(games.map(game => {
        return { ...game,
          reqTime: strToDate(game.requestDate).getTime(),
          canJoin: this.store.canJoinGame(game),
          canPlay: this.store.canPlayGame(game),
        };
      }));
      console.log('gamesList', this.gamesList.loadedList);
    })
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  newGame() {
    this.store.newGame().then(() => {
      this.growl.success('view.games.request_send');
    });
  }


  joinGame(game) {
    this.store.joinGame(game);
  }

}
