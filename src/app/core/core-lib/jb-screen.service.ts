import { Injectable } from '@angular/core';
import {JbEventsService} from './jb-events.service';

/**
 * @description It allows media queries in JS
 * @Example:
 *    <div [class.big-box]="JbScreen.isMD"></div>       // Applies for resolutions >= 1200px (MD + LG + XL)
 *    <div [class.small-box]="!JbScreen.isMD"></div>    // Applies for resolutions < 1200px (XS + SM)
 *
 *    <div [class.sm]="!JbScreen.size === 'SM'"></div>  // Applies only for 768 - 992 (SM)
 *
 *    if (this.JbScreen.is('(min-width:992px)')) { ... }
 */
@Injectable({ providedIn: 'root' })
export class JbScreenService {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isXS            = false;
  isSM            = false;
  isMD            = false;
  isLG            = false;
  isXL            = false;
  isMobile        = false;
  isTablet        = false;
  isMedium        = false;
  isLarge         = false;
  isExtraLarge    = false;
  isTouch         = false;
  isDesktop       = false;
  isQueueLarge    = false;
  isQueueMedium   = false;

  constructor(private jbEvents: JbEventsService) {
    this.calculateSize();
    this.jbEvents.onWindowResize$.subscribe(this.calculateSize);
  }
  public is = (mediaQuery: string) => window.matchMedia(mediaQuery).matches;

  public calculateSize = () => {
    this.isXS  = true;
    this.isSM  = this.is('(min-width:768px)');
    this.isMD  = this.is('(min-width:992px)');
    this.isLG  = this.is('(min-width:1200px)');
    this.isXL  = this.is('(min-width:1600px)');
    this.size = this.isXL ? 'xl' : this.isLG ? 'lg' : this.isMD ? 'md' : this.isSM ? 'sm' : 'xs';

    this.isMobile      = this.is('(max-width:767px)');
    this.isTablet      = this.is('(min-width:768px) and (max-width:991px)');
    this.isMedium      = this.is('(min-width:992px) and (max-width:1199px)');
    this.isLarge       = this.is('(min-width:1200px)');
    this.isExtraLarge  = this.is('(min-width:1440px)');
    this.isTouch       = this.is('(max-width:991px)');
    this.isDesktop     = this.is('(min-width:992px)');
    this.isQueueLarge  = this.is('(min-width:1250px)'); // Used for the Queue-Agent page
    this.isQueueMedium = this.is('(min-width:992px) and (max-width:1249px)'); // Used for the Queue-Agent page
  };

}
