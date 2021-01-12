import {Injectable} from "@angular/core";
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/firestore";
import {IGameDoc} from "@core/store/store.service";
import {Observable} from "rxjs";
import {JbProfileService} from "@core/common/jb-profile.service";
import {AngularFireAuth} from "@angular/fire/auth";


@Injectable({ providedIn: 'root', })
export class ChatService {
  public gamesCol: AngularFirestoreCollection<IGameDoc>;
  public games$: Observable<IGameDoc[]>;

  constructor(
    private profile: JbProfileService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
  ) {
  }

  sendMsg(game, text, owner) {
    const gameDoc = this.afs.doc<IGameDoc>('games/' + game.id);
    game.chat.push({
      order: game.chat.length + 1,
      timeMsg: new Date() + '',
      text,
      owner,
    });
    console.log('game.chat', game.chat);
    return gameDoc.update({ chat: game.chat });
  }

}
