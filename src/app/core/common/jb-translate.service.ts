import {Injectable} from '@angular/core';
import {AbstractTranslateService, JbLoadingBarService} from 'jb-ui-lib';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

// Locale configs
import {registerLocaleData} from '@angular/common';
import localeEnUS from '@angular/common/locales/en-US-POSIX';
import localeDe   from '@angular/common/locales/de';
import localeIt   from '@angular/common/locales/it';
import localeEsES from '@angular/common/locales/es';
import localeCa   from '@angular/common/locales/ca';

registerLocaleData(localeEnUS, 'en');
registerLocaleData(localeDe,   'de');
registerLocaleData(localeIt,   'it');
registerLocaleData(localeEsES, 'es');
registerLocaleData(localeCa,   'ca');


/********************************************************
 * This is a wrapper for ngx-translate service
 * DOC: https://github.com/ngx-translate/core
********************************************************/
@Injectable({ providedIn: 'root' })
export class JbTranslateService extends AbstractTranslateService {
  public readonly storageLocaleKey = 'NG_TRANSLATE_LANG_KEY';
  public readonly fallbackLocaleId = 'en';
  public readonly fallbackLanguage = 'en'; // Fallback dictionary. If a translation is not found for the current, use this
  public supportedLanguages = [
    { code: 'en',   name: 'English', country: 'US',  localeId: 'en' },
    { code: 'de',   name: 'German',  country: 'DE',  localeId: 'de' },
    { code: 'it',   name: 'Italian', country: 'IT',  localeId: 'it' },
    { code: 'es',   name: 'Spanish', country: 'ES',  localeId: 'es' },
    { code: 'cat',  name: 'Catalan', country: 'ES',  localeId: 'ca' },
  ];

  public onLangChange$: Observable<{ lang, translations }>; // Emits every time the selected language changes
  public currentLocale = this.fallbackLocaleId;
  public locale$ = new BehaviorSubject(this.fallbackLocaleId);


  // Watch the DIs here --> This will be injected in jb-ui-lib
  constructor(
    private http: HttpClient,
    private loadingBar: JbLoadingBarService,
    private translate: TranslateService,
  ) {
    super();

    this.onLangChange$ = this.translate.onLangChange.pipe(
      map((event: LangChangeEvent) => ({ lang: event.lang, translations: event.translations }))
    );

    this.translate.onLangChange.subscribe((event: LangChangeEvent) => this.locale$.next(event.lang));

    // this.translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => { ... });
    // this.translate.onDefaultLangChange.subscribe((event: DefaultLangChangeEvent) => { ... });

    this.translate.addLangs(this.supportedLanguages.map(lang => lang.code)); // Add to ngx-translate module
    // You can get'em with: translate.getLangs();

    // This would enable the fallback language loading
    // this.translate.setDefaultLang(this.fallbackLanguage);

    // Select NG_TRANSLATE_LANG_KEY
    const storedLanguage = localStorage.getItem(this.storageLocaleKey);
    if (storedLanguage) { this.changeLanguage(storedLanguage); }

    // If there is no valid stored language, determine a default one
    if (!this.supportedLanguages.getByProp('code', storedLanguage)) {
      const browserLang = (navigator.language || navigator.languages && navigator.languages[0] || navigator['userLanguage'] || '').toLowerCase();
      if (this.supportedLanguages.getByProp('code', browserLang)) {
        this.changeLanguage(browserLang); // Browser's language
      } else {
        this.changeLanguage(this.fallbackLanguage); // Default
      }
    }
  }


  // Change the current locale and reload the translations dictionary
  public changeLanguage = (newLang: string) => {
    // console.log('CHANGING LANGUAGE TO ----> ', newLang);
    this.translate.use(newLang);
    localStorage.setItem(this.storageLocaleKey, newLang);

    // Set current locale from the language
    const currentLang = this.supportedLanguages.getByProp('code', newLang);
    this.currentLocale = (currentLang ? currentLang.localeId : this.fallbackLocaleId) || this.fallbackLocaleId;

    // This doesn't work (LOCALE_ID is static). We must use 'jbDate' extended pipe
    // @Inject(LOCALE_ID) private _locale: string,
    // const currentLocale = getLocaleId(this._locale);
    // this._locale = newLocale;
  };


  // Instant translation
  public doTranslate = (label ?: string, params = {}): string => {
    let response = (label || '') + '';
    if (!!this.translate && !!this.translate.instant && !!label) {
      response = this.translate.instant(label, params);
    }
    return response;
  };

  // Returns an observable the reacts to label changes across languages
  public getLabel$ = (label ?: string, params = {}): Observable<string> => {
    if (!label) { return of(''); }
    return this.translate.stream(label + '', params);
  };


}
