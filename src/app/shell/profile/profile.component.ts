import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {JbProfileService} from '../../core/common/jb-profile.service';
import {IjbInputCtrl, JbGrowlService} from "jb-ui-lib";
import {filter, map} from "rxjs/operators";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  public displayName = '';
  public inputCtrl$;
  constructor(
    public router: Router,
    public profile: JbProfileService,
    private growl: JbGrowlService,
  ) {}

  ngOnInit() {
    this.displayName = this.profile.user.displayName;
    this.inputCtrl$ = this.profile.isPanelExp$.pipe(filter(v => v), map(_ => ({ action: 'setFocus' })));
  }

  public updateProfile = () => {
    this.profile.updateProfile(this.displayName).then(() => {
      this.growl.success('view.profile.updated_successfully');
      this.profile.toggleProfile();
    });
  };
}
