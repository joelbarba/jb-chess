import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {EGameStatus, StoreService} from "@core/store/store.service";
import {JbProfileService} from "@core/common/jb-profile.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PieceSelectorModal} from "./piece-selector-modal/piece-selector.modal";
import {JbConfirmService} from "jb-ui-lib";

@Component({
  selector: 'jb-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  public gameId;
  public game;
  public sub;
  public yourColor: 'WHITE' | 'BLACK';
  public otherColor: 'WHITE' | 'BLACK';
  public phase = 0; // 0=select piece, 1=select destination
  public selPos;    // Position of the selected piece (to move)
  public validMoves = []; // Valid destination nums for the selected piece
  public reverseBoard = false;  // false=white at the bottom, true=black at the bottom
  public mode = 'play'; // play=make next move,  analyse=play both (no commit)

  public squares = Array.from({ length: 64 }, (x, i) => i);

  public tab = 'moves';

  constructor(
    public store: StoreService,
    public profile: JbProfileService,
    public router: Router,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private confirm: JbConfirmService,
  ) {
  }

  ngOnInit(): void {
    let firstLoad = true;
    this.gameId = this.route.snapshot.paramMap.get('gameId');

    this.sub = this.store.getGame$(this.gameId).subscribe(game => {
      this.game = { ...game, id: this.gameId }; // update the game

      if (firstLoad) { // set game vars
        this.yourColor = game.player1 === this.profile.user.id ? 'WHITE' :'BLACK';
        this.otherColor = this.yourColor === 'BLACK' ? 'WHITE' :'BLACK';
        this.reverseBoard = this.yourColor === 'BLACK';

      } else { // Check if check mate (opponent's won)
        if (game.status === this.otherColor + ' WON') {
          this.confirm.open({
            title            : 'view.game.check_mate',
            htmlContent      : '<h4 class="text-center">Sorry, you lost.</h4>',
            yesButtonText    : 'view.common.ok',
            showNo           : false,
            showCancel       : false,
          });
        }
      }

      firstLoad = false;
    });

    this.onResize();
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

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


  // White player (reverseBoard=false) --> pos = pos
  // Black player (reverseBoard=true) ---> pos = 64 - pos
  public getPos = (pos) => !this.reverseBoard ? pos : 63 - pos;

  public resetGame = () => {
    this.store.resetGame(this.game);
    this.store.updateGame(this.game);
  }

  public revertLast = () => {
    this.game.history.pop();
    const lastMove = this.game.history.getLast();
    if (lastMove) {
      this.game.board = [...lastMove.nextBoard];
    } else {
      this.store.resetGame(this.game);
    }
    this.game.status = this.game.status === EGameStatus.WHITE ? EGameStatus.BLACK : EGameStatus.WHITE;
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
    if (game.status === EGameStatus.WHITE_WON || game.status === EGameStatus.BLACK_WON) {
      this.confirm.open({
        title            : 'view.game.check_mate',
        htmlContent      : '<h4 class="text-center">Congratulations, you won!</h4>',
        yesButtonText    : 'view.common.ok',
        showNo           : false,
        showCancel       : false,
      });
    }
    return this.store.updateGame(game);
  }

}
