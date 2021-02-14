import {Component} from '@angular/core';
import {NgbTooltipConfig} from '@ng-bootstrap/ng-bootstrap';
import {Title} from '@angular/platform-browser';
import {ActivationEnd, NavigationStart, Router} from '@angular/router';
import {JbTranslateService} from './core/common/jb-translate.service';
import {JbProfileService} from './core/common/jb-profile.service';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'jb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    public profile: JbProfileService,
    private ngbTooltip: NgbTooltipConfig,
    private titleService: Title,
    private router: Router,
    private jbTrans: JbTranslateService,
    private translate: TranslateService,
  ) {

    // ngb tooltip global config (https://ng-bootstrap.github.io/#/components/tooltip/api#NgbTooltip)
    ngbTooltip.placement = 'top';
    ngbTooltip.container = 'body';

    // Listen to the routing and set the title of the document dynamically
    let pageTitle = '';        // Label to display on the page title (left)
    let isTitleSet = false;    // Flag to know if the title has been found within the nested child process
    this.router.events.subscribe((routeEvent) => {
      if (routeEvent instanceof NavigationStart) { isTitleSet = false; }
      if (routeEvent instanceof ActivationEnd) {
        // Update the page title with the new page label. Take the label of the last nested route
        if (!isTitleSet && !!routeEvent.snapshot.routeConfig.data && !!routeEvent.snapshot.routeConfig.data.label) {
          pageTitle = routeEvent.snapshot.routeConfig.data.label;
          this.titleService.setTitle(`${this.jbTrans.doTranslate(pageTitle)} | ${this.jbTrans.doTranslate('tag.title')}`);
          isTitleSet = true;
        }
      }
    });

    // Update the page title every time the translation language changes
    this.titleService.setTitle(`${this.jbTrans.doTranslate('tag.title')}`);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.titleService.setTitle(`${this.jbTrans.doTranslate(pageTitle)} | ${this.jbTrans.doTranslate('tag.title')}`);
    });
  }
  
}
