import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {JbProfileService} from '../../core/common/jb-profile.service';
import {JbGrowlService} from "jb-ui-lib";
import {filter, map} from 'rxjs/operators';
import {JbEventsService} from '../../core/core-lib/jb-events.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  public displayName = '';
  public inputCtrl$;
  public sub;

  @ViewChild('profileContainer') profileContainer: ElementRef;

  constructor(
    public router: Router,
    public profile: JbProfileService,
    private growl: JbGrowlService,
    private jbEvents: JbEventsService,
  ) {}

  ngOnInit() {
    this.displayName = this.profile.user.displayName;
    this.inputCtrl$ = this.profile.isPanelExp$.pipe(filter(v => v), map(_ => ({ action: 'setFocus' })));

  }

  // ngAfterViewInit() { // Collapse on click outside
  //   this.sub = this.jbEvents.detectClickOutside([this.profileContainer.nativeElement], { ignoreTextSelection: true }).subscribe(() => {
  //     this.profile.toggleProfile(false);
  //   });
  // }

  // ngOnDestroy() { this.sub.unsubscribe(); }
  ngOnDestroy() { }

  public updateProfile = () => {
    this.profile.updateProfile(this.displayName).then(() => {
      this.growl.success('view.profile.updated_successfully');
      this.profile.toggleProfile(false);
    });
  };
}
