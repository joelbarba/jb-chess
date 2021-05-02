import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'jb-piece-selector',
  templateUrl: './piece-selector.modal.html',
  styleUrls: ['./piece-selector.modal.scss']
})
export class PieceSelectorModal implements OnInit {
  public color: 'WHITE' | 'BLACK' = 'WHITE';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {}

  public selectPiece = (piece) => {
    if (this.color === 'WHITE') {
      switch (piece) {
        case 'rook'   : this.activeModal.close(9); break;
        case 'knight' : this.activeModal.close(10); break;
        case 'bishop' : this.activeModal.close(11); break;
        case 'queen'  : this.activeModal.close(12); break;
      }
    } else {
      switch (piece) {
        case 'rook'   : this.activeModal.close(25); break;
        case 'knight' : this.activeModal.close(26); break;
        case 'bishop' : this.activeModal.close(27); break;
        case 'queen'  : this.activeModal.close(28); break;
      }
    }
  }
}
