import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, take} from 'rxjs/operators';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {JbProfileService} from '@core/common/jb-profile.service';
import {dCopy, JbGrowlService} from 'jb-ui-lib';
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

//   R   Kn  B   Q   K   B   Kn  R            R   Kn  B   Q   K   B   Kn  R
//   ----------------------------------------------------------------------
//   25, 26, 27, 28, 29, 30, 31, 32,  | 0 |  00  01  02  03  04  05  06  07
//   17, 18, 19, 20, 21, 22, 23, 24,  | 1 |  08  09  10  11  12  13  14  15
//   0,  0,  0,  0,  0,  0,  0,  0,   | 2 |  16  17  18  19  20  21  22  23
//   0,  0,  0,  0,  0,  0,  0,  0,   | 3 |  24  25  26  27  28  29  30  31
//   0,  0,  0,  0,  0,  0,  0,  0,   | 4 |  32  33  34  35  36  37  38  39
//   0,  0,  0,  0,  0,  0,  0,  0,   | 5 |  40  41  42  43  44  45  46  47
//   1,  2,  3,  4,  5,  6,  7,  8,   | 6 |  48  49  50  51  52  53  54  55
//   9, 10, 11, 12, 13, 14, 15, 16,   | 7 |  56  57  58  59  60  61  62  63
//   ----------------------------------------------------------------------
//   R  Kn   B   Q   K   B  Kn   R            R  Kn   B   Q   K   B  Kn   R



@Injectable({ providedIn: 'root', })
export class StoreService {
  public gamesCol: AngularFirestoreCollection<IGameDoc>;
  public games$: Observable<IGameDoc[]>;

  constructor(
    private profile: JbProfileService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
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

  public commitMove(game, posOri, posDes, promotedPieceCode?) {
    this.makeMove(game, posOri, posDes, promotedPieceCode);
    return this.updateGame(game);
  }

  public makeMove(game, posOri, posDes, promotedPieceCode?) {
    const validMoves = this.getValidMoves(game, posOri);
    if (!validMoves.map(m => m.posDes).includes(posDes)) { return null; }
    const move = validMoves.getByProp('posDes', posDes);
    if (promotedPieceCode) {
      move.promotedTo = promotedPieceCode;
      move.nextBoard[posDes] = promotedPieceCode;
    }
    game.history.push(move);
    game.board = [...move.nextBoard];
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



  // It returns an array with all possible moves at the current state
  // Every move contains: {
  //    posOri --> original position of the moving piece
  //    posDes --> destination position of the moving piece
  //    piece ---> object with the moving piece ({ code, color, name })
  //    takes ---> the piece that is being taken (if any. if none, 0)
  //    nextBoard --> The game.board[] array after the move
  // }
  public getValidMoves = (game, posOri, fullCheck = true) => {
    const board = game.board;
    const piece = this.getPiece(board[posOri]);
    const [col, row] = this.square2D(posOri);
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

    // Returns the position the given piece is at on the board
    const piecePos = (code) => {
      for (let pos = 0; pos < 64; pos++) {
        if (board[pos] === code) { return pos; }
      }
    };

    // Adds a move to the validMoves[] array
    const addMove = (col, row) => {
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        const posDes = (row * 8) + col;
        const nextMove: any = { posOri, posDes, takes: game.board[posDes], nextBoard: dCopy(game.board) };
        nextMove.nextBoard[posDes] = nextMove.nextBoard[posOri];
        nextMove.nextBoard[posOri] = 0;
        nextMove.piece = piece.keyFilter('code,color,name');
        validMoves.push(nextMove);
        return nextMove;
      }
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
    // - The capturing pawn must have advanced exactly three ranks to perform this move.
    // - The captured pawn must have moved two squares in one move, landing right next to the capturing pawn.
    // - The en passant capture must be performed on the turn immediately after the pawn being captured moves.
    const checkEnPassant = (color) => {
      if (!game.history.length) { return; }
      const lastMove = game.history.getLast();
      const [lastDesCol, lastDesRow] = this.square2D(lastMove.posDes);
      const lastPiece = pieceAt(lastDesCol, lastDesRow);
      const row1  = color === 'WHITE' ? -1 : 1;
      const row16 = row1 * 16;
      if (lastPiece.piece.name === 'pawn' && lastMove.posOri === lastMove.posDes + row16 && row === lastDesRow) {
        if (lastDesCol === col - 1) {
          const move = addMove(col - 1, row + row1);
          move.takes =  move.nextBoard[lastMove.posDes];
          move.nextBoard[lastMove.posDes] = 0;
        }
        if (lastDesCol === col + 1) {
          const move = addMove(col + 1, row + row1);
          move.takes = move.nextBoard[lastMove.posDes];
          move.nextBoard[lastMove.posDes] = 0;
        }
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


    // Checks if the given position is being attacked by an opponent's piece. If so, it returns the attacker piece
    const isPosAttacked = (pos) => {
      if (!fullCheck) { return false; } // avoid recursivity
      const otherPieces = board.map(code => this.getPiece(code)).filter(piece => piece.color === otherColor);
      for (const otherPiece of otherPieces) {
        const attackMoves = this.getValidMoves(game, piecePos(otherPiece.code), false).filter(move => move.posDes === pos);
        if (attackMoves.length > 0) { return otherPiece; }
      }
    }

    // Castling
    // - The king and the rook may not have moved from their starting squares if you want to castle.
    // - All spaces between the king and the rook must be empty.
    // - The king cannot be in check.
    // - The squares that the king passes over must not be under attack, nor the square where it lands on.
    if (piece.code === 13 && piece.color === yourColor && game.history.every(m => m.piece !== 13)) { // white king
      if (game.history.every(m => m.piece !== 16)) {  // King <-> Right Rook
        if (pieceAt(5, 7).isEmpty() && pieceAt(6, 7).isEmpty()) {
          if (!isPosAttacked(60) && !isPosAttacked(61) && !isPosAttacked(62)) {
            const move = addMove(6, 7);
            move.nextBoard[63] = 0; move.nextBoard[61] = 16;
          }
        }
      }
      if (game.history.every(m => m.piece !== 9)) { // Left Rook <-> King
        if (pieceAt(1, 7).isEmpty() && pieceAt(2, 7).isEmpty() && pieceAt(3, 7).isEmpty()) {
          if (!isPosAttacked(60) && !isPosAttacked(59) && !isPosAttacked(58)) {
            const move = addMove(2, 7);
            move.nextBoard[56] = 0; move.nextBoard[59] = 9;
          }
        }
      }
    }
    if (piece.code === 29 && piece.color === yourColor && game.history.every(m => m.piece !== 29)) { // black king
      if (game.history.every(m => m.piece !== 32)) {  // Right Rook
        if (pieceAt(5, 0).isEmpty() && pieceAt(6, 0).isEmpty()) {
          if (!isPosAttacked(4) && !isPosAttacked(5) && !isPosAttacked(6)) {
            const move = addMove(6, 0);
            move.nextBoard[7] = 0; move.nextBoard[5] = 32;
          }
        }
      }
      if (game.history.every(m => m.piece !== 25)) { // Left Rook
        if (pieceAt(1, 0).isEmpty() && pieceAt(2, 0).isEmpty() && pieceAt(3, 0).isEmpty()) {
          if (!isPosAttacked(4) && !isPosAttacked(3) && !isPosAttacked(2)) {
            const move = addMove(2, 0);
            move.nextBoard[0] = 0; move.nextBoard[3] = 25;
          }
        }
      }
    }



    if (!fullCheck) { return validMoves; } // exclude moves that would cause mate (to avoid recursivity)

    // Invalidate mate moves:
    // If a move puts the king in a position that can be taken at the next move, remove it because it is not valid
    return validMoves.filter(move => {
      const nextGame = dCopy(game);
      nextGame.board = move.nextBoard;
      nextGame.history.push(move);
      // Filter opponent's pieces and calculate all opponent's valid moves after move.
      // If any of these calculated valid moves takes the king, invalidate the current move.
      return !nextGame.board.map(code => this.getPiece(code)).some(piece => {
        if (piece.color !== otherColor) { return false; }
        const killMoves = this.getValidMoves(nextGame, piecePos(piece.code), false).filter(nextMove => {
          return yourColor === 'WHITE' && nextMove.takes === 13
              || yourColor === 'BLACK' && nextMove.takes === 29;
        });
        // if (killMoves.length > 0) { console.log('Killing moves', piece, killMoves); }
        return killMoves.length > 0;
      });
    });

  }


  // Check if the move is a Pawn reaching the other side of the board
  public isPawnFinished = (posOri, posDes, board) => {
    const piece = this.getPiece(board[posOri]);
    if (piece.name === 'pawn') {
      if (piece.color === 'WHITE' && [0,1,2,3,4,5,6,7].includes(posDes)) { return true; }
      if (piece.color === 'BLACK' && [56,57,58,59,60,61,62,63].includes(posDes)) { return true; }
    }
    return false;
  }

}
