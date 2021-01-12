import {Pipe, PipeTransform} from '@angular/core';
import {DatePipe} from '@angular/common';
import {JbTranslateService} from '../common/jb-translate.service';
// import {SelectSnapshot} from '@ngxs-labs/select-snapshot';
// import moment from 'moment';
// import 'moment-timezone';

@Pipe({ name: 'jbDate', pure: false })
export class JbDatePipe implements PipeTransform {
  private value: string | null;
  private lastDate: any;
  private lastLocale: string;
  private lastTimeZone: string;
  // @SelectSnapshot(state => state.app.profile.time_zone) profileTimezone;

  constructor(private jbTranslate: JbTranslateService) {}

  transform(date: any, format = 'mediumDate', timezone?: string, locale?: string): string | null {
    const currentLocale = this.jbTranslate.currentLocale;

    // According to the backend, dates always come with the profile timezone applied, so we needn't convert it again.
    // if (!timezone) { timezone = moment(date).tz(this.profileTimezone).format('Z'); }

    if (date !== this.lastDate || currentLocale !== this.lastLocale || timezone !== this.lastTimeZone) {
      this.value = new DatePipe(currentLocale).transform(date, format, timezone);
      this.lastDate = date;
      this.lastLocale = currentLocale;
      this.lastTimeZone = timezone;
    }
    return this.value;
  }
}

