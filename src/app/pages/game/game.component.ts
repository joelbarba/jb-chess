import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {EGameStatus, StoreService} from "@core/store/store.service";
import {JbProfileService} from "@core/common/jb-profile.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PieceSelectorModal} from "./piece-selector-modal/piece-selector.modal";
import {JbConfirmService} from "jb-ui-lib";
import {interval} from "rxjs";
import {distinctUntilChanged, map, take} from "rxjs/operators";
import {SubSink} from "subsink";
import {ChatService} from "@core/store/chat.service";
import {VideoService} from "@core/store/video.service";


@Component({
  selector: 'jb-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GameComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  public gameId;
  public game;
  public yourColor: 'WHITE' | 'BLACK';
  public otherColor: 'WHITE' | 'BLACK';
  public phase = 0; // 0=select piece, 1=select destination
  public selPos;    // Position of the selected piece (to move)
  public validMoves = []; // Valid destination nums for the selected piece
  public reverseBoard = false;  // false=white at the bottom, true=black at the bottom
  public mode = 'play'; // play=make next move,  analyse=play both (no commit)

  public squares = Array.from({ length: 64 }, (x, i) => i);

  tab = 'moves';
  chatInput = '';

  constructor(
    public store: StoreService,
    public chat: ChatService,
    public profile: JbProfileService,
    public router: Router,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private confirm: JbConfirmService,
    public video: VideoService,
  ) {
  }

  async ngOnInit() {
    let firstLoad = true;
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    const tokenId = this.route.snapshot.paramMap.get('tokenId');
    console.log('GAME ID:', this.gameId, 'TOKEN ID:', tokenId);

    if (!this.profile.user) {
      if (!tokenId) { this.unknownPlayer() }
      await this.profile.anonymousLogin(); // Generate anonymous user if none
    }

    await this.profile.ready;

    // 1st game load
    this.subs.add(this.store.getGame$(this.gameId).pipe(take(1)).subscribe(game => {
      console.log('My profile ID:', this.profile.user.id);

      // Determine who you are (player 1 or 2)
      if (game.token1 === tokenId || game.player1 === this.profile.user.id) { this.yourColor = 'WHITE'; }
      if (game.token2 === tokenId || game.player2 === this.profile.user.id) { this.yourColor = 'BLACK'; }
      if (!this.yourColor) { this.unknownPlayer(); } // If this is not your game, get out
      this.otherColor = this.yourColor === 'BLACK' ? 'WHITE' :'BLACK';
      this.reverseBoard = this.yourColor === 'BLACK';

      this.video.initSignaling(this.gameId, this.yourColor);
      // this.changeTab('video');
    }));

    // Subscribe to game's changes
    this.subs.add(this.store.getGame$(this.gameId).subscribe(game => {
      this.game = { ...game, id: this.gameId };

      // Join the requested game
      if (game.token2 === tokenId) {
        if (game.status === EGameStatus.REQUESTED) { this.store.joinGame(this.game); }
        if (game.player2 !== this.profile.user.id) { this.store.updateGamePlayer(this.game); }
      }
    }));

    // Subscribe to game's status changes
    this.subs.add(this.store.getGame$(this.gameId).pipe(
      distinctUntilChanged((prev, curr) => prev.status === curr.status)
    ).subscribe(game => {
      console.log(new Date(), 'GAME STATUS CHANGE', this.game.status);
      if (!firstLoad) { this.checkEndState(game); } // Check if check mate (opponent's won)
      firstLoad = false;
    }));

    this.subs.add(this.video.tabChange$.subscribe(tab => this.changeTab(tab)));

    this.onResize();

    // Constantly check the move timeout. TODO: Move this to a cloud function
    this.subs.add(interval(1000).subscribe(_ => {
      if (this.getRemainingTime() < 0) {
        if (this.game.status === EGameStatus.WHITE) {
          this.game.status = EGameStatus.BLACK_WON_BY_TIMEOUT;
          this.store.updateGame(this.game);
        }
        if (this.game.status === EGameStatus.BLACK) {
          this.game.status = EGameStatus.WHITE_WON_BY_TIMEOUT;
          this.store.updateGame(this.game);
        }
      }
    }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); this.video.endSignaling(); }

  public boardSize = 500;
  public minRightPanelWidth = 500;
  public isSmall = false;
  @ViewChild('panel', { static: true }) panel: ElementRef<HTMLElement>;

  @HostListener('window:resize', ['$event']) onResize() {
    const width = this.panel.nativeElement.getBoundingClientRect().width;
    const height = this.panel.nativeElement.getBoundingClientRect().height;
    this.isSmall = width < 1000;  // Small screen mode
    if (this.isSmall) {
      this.boardSize = Math.round(Math.min(width, height));
    } else {
      this.boardSize = Math.round(Math.min(width - this.minRightPanelWidth, height));
    }
  }

  unknownPlayer() {
    this.confirm.open({
      title         : 'view.game.unknown_player',
      text          : 'view.game.unknown_player',
      yesButtonText : 'view.common.ok',
      showNo        : false,
    }).then(() => {
      this.router.navigate(['home']);
    });
  }

  isAdmin = () => this.yourColor === 'WHITE';
  isGameOn = () => this.game?.status === EGameStatus.WHITE || this.game?.status === EGameStatus.BLACK;

  finishGame() {
    this.confirm.open({
      title         : 'view.game.finish_tooltip',
      text          : 'view.game.finish_confirmation',
      showCancel: false,
      showNo: true,
    }).then(res => {
      if (res === 'yes') { this.store.endGame(this.game, this.profile.user.id); }
    }, () => {});
  }

  getStatusText() {
    if (this.game?.status === EGameStatus.REQUESTED) { return 'Awaiting player to join the game'; }
    if (this.game?.status === EGameStatus.WHITE) {
      if (this.yourColor === 'WHITE') { return 'You (white) play'; }
      if (this.yourColor === 'BLACK') { return 'White plays (wait for it)'; }
    }
    if (this.game?.status === EGameStatus.BLACK) {
      if (this.yourColor === 'WHITE') { return 'Black plays (wait for it)'; }
      if (this.yourColor === 'BLACK') { return 'You (black) play' }
    }
    if (this.game?.status === EGameStatus.DRAW) { return 'Game finished, ended in Draw'; }
    if (this.game?.status === EGameStatus.WHITE_WON_BY_MATE)    { return 'Game finished, white won by mate'; }
    if (this.game?.status === EGameStatus.WHITE_WON_BY_TIMEOUT) { return 'Game finished, white won by timeout'; }
    if (this.game?.status === EGameStatus.WHITE_WON_BY_RESIGN)  { return 'Game finished, white won by resignation'; }
    if (this.game?.status === EGameStatus.BLACK_WON_BY_MATE)    { return 'Game finished, black won by mate'; }
    if (this.game?.status === EGameStatus.BLACK_WON_BY_TIMEOUT) { return 'Game finished, black won by timeout'; }
    if (this.game?.status === EGameStatus.BLACK_WON_BY_RESIGN)  { return 'Game finished, black won by resignation'; }
    return '';
  }



  // White player (reverseBoard=false) --> pos = pos
  // Black player (reverseBoard=true) ---> pos = 64 - pos
  public getPos = (pos) => !this.reverseBoard ? pos : 63 - pos;


  // Returns an array of the taken pieces of the given color
  public getTakenPieces = (color) => {
    return this.game.history.filter(m => m.takes).map(m => this.store.getPiece(m.takes)).filter(p => p.color === color);
  };


  // Returns the points ahead for the winning player (if <= 0 an empty string is displayed)
  public getPoints = (color) => {
    const calcPoints = (color) => {
      return this.getTakenPieces(color).reduce((acc, piece) => {
        if (piece.name === 'pawn')   { return acc + 1; }
        if (piece.name === 'knight') { return acc + 3; }
        if (piece.name === 'bishop') { return acc + 3; }
        if (piece.name === 'rook')   { return acc + 5; }
        if (piece.name === 'queen')  { return acc + 9; }
        return 0;
      }, 0);
    };
    let points = calcPoints(color === 'WHITE' ? 'BLACK': 'WHITE') - calcPoints(color);
    if (points > 0) { return '+' + points; }
    return '';
  };


  // Calculate the remaining times for the players moves
  public wTime$ = interval(200).pipe(map(_ => this.getFormattedTime('WHITE')));
  public bTime$ = interval(200).pipe(map(_ => this.getFormattedTime('BLACK')));
  public getRemainingTime = () => {
    if (this.game) {
      let expireTime = new Date(this.game.history.getLast()?.timeStamp || this.game.startTime);
      // console.log('this.game.nextMoveMinutes -------------->', this.game.nextMoveMinutes);
      const minutesTimeout = Number.isNaN(this.game.nextMoveMinutes) ? 30000 : Number.parseInt(this.game.nextMoveMinutes, 10);
      expireTime.addMinutes(minutesTimeout); // <--- TIME FOR THE NEXT MOVE
      const now = new Date();
      return Math.round((expireTime.getTime() - now.getTime()) / 1000);
    } else {
      return 1;
    }
  }
  public getFormattedTime = (color) => {
    if (this.game.status === EGameStatus.BLACK_WON_BY_TIMEOUT && color === 'WHITE') { return 'Timeout'; }
    if (this.game.status === EGameStatus.WHITE_WON_BY_TIMEOUT && color === 'BLACK') { return 'Timeout'; }
    const time = this.getRemainingTime();
    if (this.game.status !== color) { return '--:--:--'; }  // If not your turn, or draw.
    const sec = time % 60;
    const min = Math.floor((time - sec) / 60) % 60;
    const hour = Math.floor((time - min - sec) / 3600);
    // const day = Math.floor((time - hour - min - sec) / 86400);
    return `${hour.pad(2)}:${min.pad(2)}:${sec.pad(2)}`;
  }




  public resetGame = () => {
    this.store.resetGame(this.game);
    this.store.updateGame(this.game);
  }

  public revertLast = () => {
    this.game.history.pop();
    const lastMove = this.game.history.getLast();
    if (lastMove) {
      this.game.board = [...lastMove.nextBoard];
      this.game.status = this.game.status === EGameStatus.WHITE ? EGameStatus.BLACK : EGameStatus.WHITE;
    } else {
      this.store.resetGame(this.game);
    }
    this.store.updateGame(this.game).then(() => this.clearPhase());
  }

  private clearPhase = () => {
    this.selPos = null;
    this.validMoves = [];
    this.phase = 0;
  }
  private selectPiece = (pos) => {
    this.selPos = pos;
    this.validMoves = this.store.getValidMoves(this.game, pos).map(m => m.posDes);
    this.phase = 1;
  };

  public selectSquare = (pos) => {
    if (this.yourColor !== this.game.status) { return console.log('NOT YOUR TURN, PLEASE WAIT'); }

    if (this.phase === 0) { // Select a piece to move
      if (this.isYourPiece(pos)) { this.selectPiece(pos); }

    } else {  // Select destination
      if (this.selPos === pos) { return this.clearPhase(); }  // unselect the same piece

      const pieceAtPos = this.store.getPiece(this.game.board[pos]);
      if (pieceAtPos.color === this.yourColor) { this.selectPiece(pos); } // Selecting another of your pieces (switch selection)
      if (pieceAtPos.color !== this.yourColor) {

        const oriPiece = this.store.getPiece(this.game.board[this.selPos]); // Moving pawn
        if (this.store.isPawnFinished(this.selPos, pos, oriPiece)) { // Select a promoted piece for a pawn
          const modalRef = this.modal.open(PieceSelectorModal, { size: 'md', backdrop: 'static' });
          modalRef.componentInstance.color = this.yourColor;
          modalRef.result.then(code => this.commitMove(this.game, this.selPos, pos, code)).finally(() => this.clearPhase());

        } else { // Make the move
          this.commitMove(this.game, this.selPos, pos).then(() => this.clearPhase());
        }
      }
    }
  };

  public isSelectable = (pos) => {
    if (this.yourColor !== this.game?.status) { return false; }
    if (this.phase === 0) { return this.isYourPiece(pos); } // Select piece
    if (this.phase === 1) { return this.isYourPiece(pos) || this.validMoves.includes(pos); } // Select destination
  };

  public isYourPiece = (pos) => {
    if (this.game.board[pos] === 0) { return false; }
    const piece = this.store.getPiece(this.game.board[pos]);
    return piece.color === this.yourColor;
  }

  public commitMove(game, posOri, posDes, promotedPieceCode?) {
    this.store.makeMove(game, posOri, posDes, promotedPieceCode);
    this.checkEndState(game);
    return this.store.updateGame(game);
  }


  // Check if the game is finished, and prompt the (win / lose) popup to notify it
  public checkEndState = (game) => {
    let winner, title, htmlContent;
    switch (game.status) {
      case EGameStatus.WHITE_WON_BY_MATE:     winner = 'WHITE'; title = 'view.game.check_mate'; break;
      case EGameStatus.WHITE_WON_BY_TIMEOUT:  winner = 'WHITE'; title = 'view.game.win_by_timeout'; break;
      case EGameStatus.WHITE_WON_BY_RESIGN:   winner = 'WHITE'; title = 'view.game.win_by_resign'; break;
      case EGameStatus.BLACK_WON_BY_MATE:     winner = 'BLACK'; title = 'view.game.check_mate'; break;
      case EGameStatus.BLACK_WON_BY_TIMEOUT:  winner = 'BLACK'; title = 'view.game.win_by_timeout'; break;
      case EGameStatus.BLACK_WON_BY_RESIGN:   winner = 'BLACK'; title = 'view.game.win_by_resign'; break;
      default: break;
    }

    if (this.yourColor === winner) {
      htmlContent = '<h4 class="text-center">Congratulations, you won!</h4>';
      this.confirm.open({ title, htmlContent, yesButtonText: 'view.common.ok', showNo: false, showCancel: false });
    }
    if (this.otherColor === winner) {
      htmlContent = '<h4 class="text-center">Sorry, you lost.</h4>';
      this.confirm.open({ title, htmlContent, yesButtonText: 'view.common.ok', showNo: false, showCancel: false });
    }
  }


  changeTab(newTab = 'moves') {
    this.tab = newTab;
    if (this.tab === 'video' && !this.video.localStream) { this.video.initMedia(); }
  }

  /// ------------ CHAT -------------
  sendMsg() {
    this.chat.sendMsg(this.game, this.chatInput, this.yourColor);
    this.chatInput = '';
  }

  canAnswerCall() {
    return (this.video.playerNum === 1 && this.video.videoStatus === 'A<-B')
        || (this.video.playerNum === 2 && this.video.videoStatus === 'A->B');
  }

  getVideoStatusClass() {
    if (!this.video.videoStatus) { return 'off'; }
    if (this.video.videoStatus === 'A==B') { return 'connected'; }
    return 'connecting';
  }
}
