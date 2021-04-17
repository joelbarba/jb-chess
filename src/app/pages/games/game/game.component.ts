import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {EGameStatus, StoreService} from "@core/store/store.service";
import {JbProfileService} from "@core/common/jb-profile.service";

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
  public phase = 0; // 0=select piece, 1=select destination
  public selPos;    // Position of the selected piece (to move)
  public validMoves = []; // Valid destination nums for the selected piece

  public squares = Array.from({ length: 64 }, (x, i) => i);

  constructor(
    public store: StoreService,
    public profile: JbProfileService,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {

    this.gameId = this.route.snapshot.paramMap.get('gameId');
    // this.store.getGame(this.gameId).then(game => this.game = game);
    this.sub = this.store.getGame$(this.gameId).subscribe(game => {
      console.log('New change on the game', game);
      this.game = { ...game, id: this.gameId };
      this.yourColor = game.player1 === this.profile.user.id ? 'WHITE' : 'BLACK';
    });
  }

  ngOnDestroy() { this.sub.unsubscribe(); }


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
        this.store.commitMove(this.game, this.selPos, pos).then(() => this.clearPhase());
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



}
