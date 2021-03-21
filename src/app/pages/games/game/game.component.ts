import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {StoreService} from "@core/store/store.service";

@Component({
  selector: 'jb-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  public gameId;
  public game;
  public sub;
  public phase = 0; // 0=select piece, 1=select destination
  public selPos;    // Selected position
  public selPiece;  // Selected piece
  public validMoves = []; // Valid destination nums for the selected piece

  public squares = Array.from({ length: 64 }, (x, i) => i);

  constructor(
    public store: StoreService,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {

    this.gameId = this.route.snapshot.paramMap.get('gameId');
    // this.store.getGame(this.gameId).then(game => this.game = game);
    this.sub = this.store.getGame$(this.gameId).subscribe(game => {
      console.log('New change on the game', game);
      this.game = game;
    });
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  public selectSquare = (pos) => {
    if (this.phase === 0) {  // Select piece
      this.selPos = pos;
      this.selPiece = this.store.getPiece(this.game.board[pos]);
      this.validMoves = this.store.getValidMoves(pos, this.game.board);
      this.phase = 1;

    } else { // Select destination
      const piece = this.store.getPiece(this.game.board[pos]);
      if (piece.color === 'white') { // Selecting another of your pieces (switch selection)
        this.selPos = pos;
        this.selPiece = this.store.getPiece(this.game.board[pos]);
        this.validMoves = this.store.getValidMoves(pos, this.game.board);

      } else {
        if (this.validMoves.includes(pos) || true) { // Make the move
          this.game.board[pos] = this.game.board[this.selPos];
          this.game.board[this.selPos] = 0;
          this.selPos = null;
          this.selPiece = null;
          this.phase = 0;
        }
      }
    }
  };

  public isSelectable = (pos) => {
    if (this.phase === 0) { return this.isYourPiece(pos); } // Select piece
    if (this.phase === 1) { return this.isYourPiece(pos) || this.validMoves.includes(pos); } // Select destination
  };

  public isYourPiece = (pos) => {
    if (this.game.board[pos] === 0) { return false; }
    const piece = this.store.getPiece(this.game.board[pos]);
    return piece.color === 'white';
  }

}
