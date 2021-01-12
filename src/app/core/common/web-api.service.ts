import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {JbDefer, JbGrowlService, JbLoadingBarService} from 'jb-ui-lib';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type':  'application/json' })
};

interface IReqOptions {
  forceSpinner?: boolean;       // true=show loading spinner, false=hide it. undefined=default behaviour (show if non-GET request)
  ignoreServerErrors?: boolean; // true=default growl error on 400 response is not prompted
}

@Injectable({ providedIn: 'root' })
export class WebApiService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private loadingBar: JbLoadingBarService,
    private growl: JbGrowlService,
  ) { }

  public profilePromise = Promise.resolve();
  // public profilePromise = this.oauth.profilePromise;

  // Makes a web api request, waiting for the profile to be loaded (Auth request)
  // public webApiCall = async (requestUrl: string, method = 'GET', payload = {}): Promise<any> => {
  public request = (requestUrl: string, method = 'GET', payload = {}, options?: IReqOptions): Promise<any> => {
    return this.profilePromise.then(() => {
      return this.rxRequest(requestUrl, method, payload, options).toPromise();
    });
  };

  // Makes a web api request - Use it for exposed endpoints (no auth required)
  // public webApiNoAuth = async (requestUrl: string, method = 'GET', payload = {}): Promise<any> => {
  public noAuthRequest = (requestUrl: string, method = 'GET', payload = {}, options?: IReqOptions): Promise<any> => {
    return this.rxRequest(requestUrl, method, payload, options).toPromise();
  };

  // Makes a web api request and returns an observable to subscribe to the async response
  // public webApiRxCall = (requestUrl: string, method = 'GET', payload = {}): Observable<any> => {
  public rxRequest = (requestUrl: string, method = 'GET', payload = {}, options: IReqOptions = { forceSpinner: undefined, ignoreServerErrors: false }, file?: Blob): Observable<any> => {

    let reqObs$;
    requestUrl = 'base-api-url/' + requestUrl;

    // console.log('REDIRECT TO A DIFFERENT WEB API');
    // requestUrl = 'http://localhost:4500/' + requestUrl;

    if (method === 'GET')    { reqObs$ = this.http.get(requestUrl, httpOptions); }
    if (method === 'POST')   { reqObs$ = this.http.post(requestUrl, payload, httpOptions); }
    if (method === 'DELETE') { reqObs$ = this.http.delete(requestUrl, httpOptions); }

    // By default only non-GET request will trigger the loading spinner
    if (options.forceSpinner === undefined) { options.forceSpinner = (method !== 'GET'); }


    // http observable is passive. The request won't be trigger until it's subscribed (or added .toPromise())
    // The loading promise is active. It turns on when rxRequest is called, and resolves when the request is finished
    const reqPromise = new JbDefer();
    if (options.forceSpinner) { // Show loading bar only if the request takes more than .05s
      this.loadingBar.run(reqPromise.promise, { delayTime: 50 /*, showLogs: true */ }); // Run spinner until response
    }

    return reqObs$.pipe(
      tap(() => reqPromise.resolve()),
      catchError((resp: any) => {
        reqPromise.resolve();
        this.handleHttpErrors(resp, { url: requestUrl, options, payload });
        return throwError(resp);
      })
    );
  };

  private handleHttpErrors(response: any, requestConfig: { url: string, payload: any, options?: IReqOptions}): void {
    switch (response.status) {
      case 0: this.growl.error('scripts.common.oauth.interceptor.connection_error'); break;

      case 400: // Invalid request
        this.growl.error('error');
        break;

      case 401: // Not authorized (not logged in)
        break;

      case 403: this.growl.error('scripts.common.oauth.interceptor.forbidden'); break; // Forbidden
      case 500: this.growl.error('scripts.common.oauth.interceptor.internal_server_error'); break;
      case 503: this.growl.error('scripts.common.oauth.interceptor.service_unavailable'); break;
      default : this.growl.error('scripts.common.oauth.interceptor.bad_request_error'); break;
    }
  }

  // ---- Shortcuts for common requests ----
  public get = (requestUrl: string, params = {}, options?: IReqOptions): Promise<any> => {
    return this.profilePromise.then(() => {
      return this.rxRequest(requestUrl + this.parseParams(params), 'GET', {}, options).toPromise();
    });
  };

  public delete = (requestUrl: string, params = {}, options?: IReqOptions): Promise<any> => {
    return this.profilePromise.then(() => {
      return this.rxRequest(requestUrl + this.parseParams(params), 'DELETE', {}, options).toPromise();
    });
  };

  public post = (requestUrl: string, params = {}, payload = {}, options?: IReqOptions): Promise<any> => {
    return this.profilePromise.then(() => {
      return this.rxRequest(requestUrl + this.parseParams(params), 'POST', payload, options).toPromise();
    });
  };

  // Take an object and parse it as a query string
  private parseParams = (params: {} = {}): string => {
    let qString = '';
    let separator = '?';
    let value = '';

    for (const param in params) {
      if (params.hasOwnProperty(param)) {
        if (typeof params[param] === 'function') {
          value = params[param]();  // If it's a function, take the result
        } else {
          value = params[param];
        }
        qString += separator + param + '=' + value;
        separator = '&'; value = '';
      }
    }
    return qString;
  };

}
