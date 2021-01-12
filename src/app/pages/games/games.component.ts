import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {JbProfileService} from '@core/common/jb-profile.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {JbConfirmService, JbGrowlService, JbListHandler, ListStatus} from 'jb-ui-lib';
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
    orderReverse: true,
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
    private confirm: JbConfirmService,
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

  timeNextMove = 3*24*60; // 3 days
  newGame() {
    this.store.newGame(this.timeNextMove).then(game => {
      this.growl.success('view.games.request_send');
      console.log('game', game);
      this.showLink(game);
    });
  }

  showLink(game) {
    this.confirm.open({
      title         : 'view.game.details',
      htmlContent   : `Use this link to join as <b>Player1</b>:<br>
                       http:\\\\127.0.0.1:4200\\game\\${game.id}\\${game.token1}
                       <br>
                       or: https://jb-chess.netlify.app?gameId=${game.id}&token=${game.token1}
                       <br><br>
                       Or use this link to join as <b>Player2</b>:<br>
                       http:\\\\127.0.0.1:4200\\game\\${game.id}\\${game.token2}
                       <br>
                       or: https://jb-chess.netlify.app?gameId=${game.id}&token=${game.token2}`,
      yesButtonText : 'view.common.ok',
      showNo        : false,
      showCancel    : false,
    })
  }


  deleteGame(game) {
    this.confirm.open({ title: 'Remove Game' }).then(res => {
      if (res === 'yes') { this.store.deleteGame(game.id); }
    })
  }

}
