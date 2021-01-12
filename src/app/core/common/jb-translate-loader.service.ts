import {Injectable} from '@angular/core';
import {TranslateLoader} from '@ngx-translate/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {JbLoadingBarService} from 'jb-ui-lib';
import {enDic} from 'src/assets/dicctionaries/en';

/*************************************************************************************************
 * Hook up the ngx-translate loader with getTranslation(), to load the dictionaries dynamically
 ************************************************************************************************/
@Injectable({ providedIn: 'root' })
export class JbTranslateLoader implements TranslateLoader {

  // Watch the DIs here --> This will be injected in jb-ui-lib
  constructor(
    private http: HttpClient,
    private loadingBar: JbLoadingBarService,
  ) { }

  getTranslation(lang: string): Observable<any> {
    return of(enDic);
  }

}
