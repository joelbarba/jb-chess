import {BrowserModule} from '@angular/platform-browser';
import {LOCALE_ID, NgModule} from '@angular/core';
import {environment} from '../environments/environment';
import {AppComponent} from './app.component';
import {AppRoutingModule } from './core/common/app-routing.module';
import {CoreModule} from './core/core.module';
import {ShellModule} from './shell/shell.module';
import {NgxsModule} from '@ngxs/store';
import {NgxsSelectSnapshotModule} from '@ngxs-labs/select-snapshot';
import {NgxsReduxDevtoolsPluginModule} from '@ngxs/devtools-plugin';
import {AllStates} from "./core/store/all-states";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule, TranslateParser} from '@ngx-translate/core';
import {JbTranslateLoader} from './core/common/jb-translate-loader.service';
import {JbTranslateService} from './core/common/jb-translate.service';
import {JbUiLibModule} from 'jb-ui-lib';

import {registerLocaleData} from '@angular/common';
import localeEnUS from '@angular/common/locales/en-US-POSIX';
registerLocaleData(localeEnUS, 'en');  // Default locale


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxsModule.forRoot(AllStates, { developmentMode: !environment.production }),
    NgxsSelectSnapshotModule.forRoot(),
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: environment.production }),
    TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: JbTranslateLoader } }),
    JbUiLibModule.forRoot({ trans: { useExisting: JbTranslateService } }),
    AppRoutingModule,
    CoreModule,
    ShellModule,
  ],
  providers: [
    // { provide: ErrorHandler, useClass: JbErrorHandler },
    { provide: LOCALE_ID, useValue: 'en' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
