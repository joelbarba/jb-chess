import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {JbProfileService} from '../../core/common/jb-profile.service';
import {JbConfirmService} from 'jb-ui-lib';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(
    public router: Router,
    public profile: JbProfileService,
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private confirm: JbConfirmService,
  ) {}

  ngOnInit() {}

  logout() {
    this.confirm.open({
      title : 'view.common.logout',
      text  : 'view.profile.confirm_logout',
    }).then(() => {
      this.profile.logout()
    }, () => {});
  }


}
