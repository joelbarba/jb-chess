import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {JbProfileService} from '../../core/common/jb-profile.service';
import {AngularFireAuth} from '@angular/fire/auth';

interface GameDoc {
  user1: string,
  user2: string,
}

@Component({
  selector: 'home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public gamesRef: AngularFirestoreCollection<GameDoc>;
  public items$: Observable<GameDoc[]>;

  constructor(
    private profile: JbProfileService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
  ) {}

  ngOnInit() {
    this.gamesRef = this.afs.collection<GameDoc>('games');
    this.items$ = this.gamesRef.valueChanges();
  }

}


