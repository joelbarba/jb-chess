import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, take} from 'rxjs/operators';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {JbProfileService} from '@core/common/jb-profile.service';
import {JbGrowlService} from 'jb-ui-lib';
import {dateToStr} from '@core/core-lib/helpers';

export enum EGameStatus { REQUESTED = 'REQUESTED', WHITE = 'WHITE', BLACK = 'BLACK', FINISHED = 'FINISHED' }
export enum EPiece {
  BRook1 = 25, BKnight1 = 26, BBishop1 = 27, BQueen = 28, BKing  = 29, BBishop2 = 30, BKnight2 = 31, BRook2 = 32,
  BPawn1 = 17, BPawn2   = 18, BPawn3   = 19, BPawn4 = 20, BPawn5 = 21, BPawn6   = 22, BPawn7   = 23, BPawn8 = 24,
  WPawn1 = 1,  WPawn2   = 2,  WPawn3   = 3,  WPawn4 = 4,  WPawn5 = 5,  WPawn6   = 6,  WPawn7   = 7,  WPawn8 = 8,
  WRook1 = 9,  WKnight1 = 10, WBishop1 = 11, WQueen = 12, WKing  = 13, WBishop2 = 14, WKnight2 = 15, WRook2 = 16,
}
export interface IMove { prev: number, next: number, time: string }
export interface IGameDoc {
  player1: string,
  player2: string,
  playerName1: string,
  playerName2: string,
  status: EGameStatus;
  requestDate ?: string;
  history: Array<IMove>;
  board: Array<EPiece>;
}

const emptyBoard = [
 25, 26, 27, 28, 29, 30, 31, 32,  // 0-7    0
 17, 18, 19, 20, 21, 22, 23, 24,  // 8-15   1
  0,  0,  0,  0,  0,  0,  0,  0,  // 16-23  2
  0,  0,  0,  0,  0,  0,  0,  0,  // 24-31  3
  0,  0,  0,  0,  0,  0,  0,  0,  // 32-39  4
  0,  0,  0,  0,  0,  0,  0,  0,  // 40-47  5
  1,  2,  3,  4,  5,  6,  7,  8,  // 48-55  6
  9, 10, 11, 12, 13, 14, 15, 16,  // 56-63  7
];




@Injectable({ providedIn: 'root', })
export class StoreService {
  public gamesCol: AngularFirestoreCollection<IGameDoc>;
  public games$: Observable<IGameDoc[]>;

  public getValidMoves = (game, pos) => {
    const board = game.board;
    const piece = this.getPiece(board[pos]);
    const [col, row] = this.square2D(pos);
    const validMoves = [];
    const yourColor = piece.color;
    const otherColor = piece.color === 'WHITE' ? 'BLACK' : 'WHITE';

    // Returns an object with the piece at that position + helpers
    const pieceAt = (col, row) => {
      const isIn = row >= 0 && row <= 7 && col >= 0 && col <= 7;
      const pos = (row * 8) + col;
      const code = board[pos];
      const piece = this.getPiece(code);
      return { pos, code, piece,
        isEmpty: () => isIn && code === 0,
        isYours: () => isIn && piece?.color === yourColor,
        isOther: () => isIn && piece?.color === otherColor,
        is: (values) => {
          if (!isIn) { return false; }
          if (values.includes('empty') && code === 0) { return true; }
          if (values.includes(piece.color)) { return true; }
          return false;
        }
      };
    };
    const addMove = (col, row) => {
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) { validMoves.push((row * 8) + col); }
    };

    // If the given position is valid (has any of the values[]) add the move. Return the piece at that position
    const addMoveIf = (col, row, values) => {
      const piece = pieceAt(col, row);
      if (piece.is(values)) { addMove(col, row); }
      return piece;
    };

    if (piece.name === 'knight' && piece.color === yourColor) {
      addMoveIf(col - 1, row - 2, ['empty', otherColor]);
      addMoveIf(col + 1, row - 2, ['empty', otherColor]);
      addMoveIf(col - 2, row - 1, ['empty', otherColor]);
      addMoveIf(col + 2, row - 1, ['empty', otherColor]);
      addMoveIf(col - 2, row + 1, ['empty', otherColor]);
      addMoveIf(col - 1, row + 2, ['empty', otherColor]);
      addMoveIf(col + 2, row + 1, ['empty', otherColor]);
      addMoveIf(col + 1, row + 2, ['empty', otherColor]);
    }
    if ((piece.name === 'queen' || piece.name === 'rook') && piece.color === yourColor) {
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col, row - t, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col, row + t, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col - t, row, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col + t, row, ['empty', otherColor]).isEmpty()) { break; } }
    }
    if ((piece.name === 'queen' || piece.name === 'bishop') && piece.color === yourColor) {
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col - t, row - t, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col - t, row + t, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col + t, row - t, ['empty', otherColor]).isEmpty()) { break; } }
      for (let t = 1; t <= 8; t++) { if (!addMoveIf(col + t, row + t, ['empty', otherColor]).isEmpty()) { break; } }
    }
    if (piece.name === 'king' && piece.color === yourColor) {
      addMoveIf(col - 1, row - 1, ['empty', otherColor]);
      addMoveIf(col,     row - 1, ['empty', otherColor]);
      addMoveIf(col + 1, row - 1, ['empty', otherColor]);
      addMoveIf(col - 1, row,     ['empty', otherColor]);
      addMoveIf(col + 1, row,     ['empty', otherColor]);
      addMoveIf(col - 1, row + 1, ['empty', otherColor]);
      addMoveIf(col,     row + 1, ['empty', otherColor]);
      addMoveIf(col + 1, row + 1, ['empty', otherColor]);
    }

    // En Passant (Pawn takes pawn next to it moving in diagonal, after opponent's pawn moved 2 positions opening)
    const checkEnPassant = (color) => {
      if (!game.history.length) { return; }
      const lastMove = game.history.getLast();
      const [lastDesCol, lastDesRow] = this.square2D(lastMove.posDes);
      const lastPiece = pieceAt(lastDesCol, lastDesRow);
      const row1  = color === 'WHITE' ? -1 : 1;
      const row16 = row1 * 16;
      if (lastPiece.piece.name === 'pawn' && lastMove.posOri === lastMove.posDes + row16 && row === lastDesRow) {
        if (lastDesCol === col - 1) { addMove(col - 1, row + row1); }
        if (lastDesCol === col + 1) { addMove(col + 1, row + row1); }
      }
    }

    if (piece.name === 'pawn' && piece.color === 'WHITE') {
      if (row === 6 && pieceAt(col, row - 1).isEmpty() && pieceAt(col, row - 2).isEmpty()) { addMove(col, row - 2); }  // Advance 2
      addMoveIf(col, row - 1, ['empty']); // Advance 1
      addMoveIf(col - 1, row - 1, [otherColor]); // Kill left
      addMoveIf(col + 1, row - 1, [otherColor]); // Kill right
      checkEnPassant(piece.color);
    }
    if (piece.name === 'pawn' && piece.color === 'BLACK') {
      if (row === 1 && pieceAt(col, row + 1).isEmpty() && pieceAt(col, row + 2).isEmpty()) { addMove(col, row + 2); }  // Advance 2
      addMoveIf(col, row + 1, ['empty']); // Advance 1
      addMoveIf(col - 1, row + 1, [otherColor]); // Kill left
      addMoveIf(col + 1, row + 1, [otherColor]); // Kill right
      checkEnPassant(piece.color);
    }

    return validMoves;
  }



  constructor(
    private profile: JbProfileService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private growl: JbGrowlService,
  ) {
    this.gamesCol = this.afs.collection<IGameDoc>('games');
    this.games$ = this.gamesCol.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as IGameDoc;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );


  }

  public getGames = (): any => this.games$.pipe(take(1)).toPromise();
  public getGame$ = gameId => this.afs.doc<IGameDoc>('/games/' + gameId).valueChanges();
  public getGame  = gameId => this.getGame$(gameId).pipe(take(1)).toPromise();


  public newGame() { // TODO: Move this to a cloud function (games should be read only)
    return this.getGames().then(games => { // Find a requested game to join as player 2
      const game = games.find(g => this.canJoinGame(g));
      if (game) { return this.joinGame(game); }
      return this.requestGame(); // If none, create a new game
    });
  }

  public requestGame() {
    return this.gamesCol.add({
      requestDate : dateToStr(new Date()),
      player1     : this.profile.user.id,
      player2     : null,
      playerName1 : this.profile.user.displayName,
      playerName2 : null,
      status      : EGameStatus.REQUESTED,
      history     : [],
      board       : [...emptyBoard],
    });
  }

  public joinGame(game) {
    const gameDoc = this.afs.doc<IGameDoc>('games/' + game.id);
    const joinGame = {
      requestDate : game.requestDate,
      player1     : game.player1,
      player2     : this.profile.user.id,
      playerName1 : game.playerName1,
      playerName2 : this.profile.user.displayName,
      status      : EGameStatus.WHITE,
      history     : [],
      board       : [...emptyBoard],
    };
    return gameDoc.update(joinGame);
  }

  public commitMove(game, posOri, posDes) {
    this.makeMove(game, posOri, posDes);
    return this.updateGame(game);
  }

  public makeMove(game, posOri, posDes) {
    const validMoves = this.getValidMoves(game, posOri);
    if (!validMoves.includes(posDes)) { return null; }

    const piece = this.getPiece(game.board[posOri]);

    const move: any = { posOri, posDes, piece: game.board[posOri] };
    if (game.board[posDes] > 0) { move.takes = game.board[posDes]; } // Add taken piece

    // En Passant: Pawn next to pawn takes by moving diagonal, after opponent's pawn moved 2 positions opening
    const prevMove = game.history.getLast();
    if (piece.name === 'pawn' && prevMove) {
      const prevPiece = this.getPiece(game.board[prevMove.posDes]);
      if (prevPiece.name === 'pawn') {
        if ((prevMove.posOri === prevMove.posDes - 16 && posDes === prevMove.posDes - 8) ||
            (prevMove.posOri === prevMove.posDes + 16 && posDes === prevMove.posDes + 8)) {
          game.board[prevMove.posDes] = 0;
          move.takes = prevPiece.code;
        }
      }
    }

    game.history.push(move);
    game.board[posDes] = game.board[posOri];
    game.board[posOri] = 0;
    game.status = game.status === EGameStatus.WHITE ? EGameStatus.BLACK : EGameStatus.WHITE;
    return move;
  }

  // TODO: This should trigger a cloud function that validates the move
  public updateGame(game) {
    const gameDoc = this.afs.doc<IGameDoc>('games/' + game.id);
    return gameDoc.update(game);
  }

  public resetGame = (game) => {
    game.history = [];
    game.status = EGameStatus.WHITE;
    game.board = [...emptyBoard];
  }


  // --------------- Helpers ---------------
  public canJoinGame(game) {
    return game.status === EGameStatus.REQUESTED
      && game.player1 !== this.profile.user.id
      && game.player2 === null
  }

  public canPlayGame = game => game.status === EGameStatus.WHITE || game.status === EGameStatus.BLACK;

  public squareRow = num => Math.floor(num / 8);
  public square2D = num => [num % 8, this.squareRow(num)];  // row = [0, ... 7]
  public squareColor = num => (num + (this.squareRow(num) % 2)) % 2 === 0 ? 'white' : 'black';

  public getPiece = code => {
    const pType = { code, name: '', color: '', img: '' };
    if ([1, 2, 3, 4, 5, 6, 7, 8].includes(code))            { pType.name = 'pawn';    pType.color = 'WHITE'; }
    if ([EPiece.WRook1,   EPiece.WRook2].includes(code))    { pType.name = 'rook';    pType.color = 'WHITE'; }
    if ([EPiece.WKnight1, EPiece.WKnight2].includes(code))  { pType.name = 'knight';  pType.color = 'WHITE'; }
    if ([EPiece.WBishop1, EPiece.WBishop2].includes(code))  { pType.name = 'bishop';  pType.color = 'WHITE'; }
    if (code === EPiece.WQueen)                             { pType.name = 'queen';   pType.color = 'WHITE'; }
    if (code === EPiece.WKing)                              { pType.name = 'king';    pType.color = 'WHITE'; }
    if ([17, 18, 19, 20, 21, 22, 23, 24].includes(code))    { pType.name = 'pawn';    pType.color = 'BLACK'; }
    if ([EPiece.BRook1,   EPiece.BRook2].includes(code))    { pType.name = 'rook';    pType.color = 'BLACK'; }
    if ([EPiece.BKnight1, EPiece.BKnight2].includes(code))  { pType.name = 'knight';  pType.color = 'BLACK'; }
    if ([EPiece.BBishop1, EPiece.BBishop2].includes(code))  { pType.name = 'bishop';  pType.color = 'BLACK'; }
    if (code === EPiece.BQueen)                             { pType.name = 'queen';   pType.color = 'BLACK'; }
    if (code === EPiece.BKing)                              { pType.name = 'king';    pType.color = 'BLACK'; }

    if (pType.name) { pType.img = `assets/${pType.color[0].toLowerCase()}-${pType.name}.png`; }
    return pType;
  }


}
