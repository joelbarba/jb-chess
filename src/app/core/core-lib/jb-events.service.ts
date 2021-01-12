import {Injectable} from '@angular/core';
import {EventManager} from '@angular/platform-browser';
import {Observable, Subject} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';

export interface IDetectClickOptions {
  ignoreTextSelection : boolean;  // Whether a text selection outside the container should be ignored (true)
  usePosition         : boolean;  // Whether to use positioning (true) or node inheritance to determine the click side
}

/**
 * @ngdoc service
 * @description This service handles global events on the main document.
 * It provides observables to react on those elements so no more listeners need to be added
 *
 * @method detectClickOutside([containers], options?): Subject<Event>
 *   @description You can generate an observable that emits only if the click was outside a list of given html elements
 *                Subscribing to that you can trigger a function for that case only.
 *    Example:
 *
 *    <div #myContainer>...</div>
 *    @ViewChild("myContainer", { static: false }) myContainer: ElementRef;
 *
 *    ngAfterViewInit() {
 *      this.sub = this.JbEventsService.detectClickOutside([this.myContainer.nativeElement], { ignoreTextSelection: true })
 *      .subscribe(res => {
 *        console.log('Danny, you are out of your element!');
 *      });
 *    }
 *    ngOnDestroy() { this.sub.unsubscribe(); }
 *
 *
 *
 * @method onKeyUp(options?): Subject<KeyboardEvent>
 *   @description Generates an observable that emits on keyboard key up. Options can define prebuild filters
 *                - onlyBody: boolean   (false by default). If true it emits only if the event is produced on the body
 *                                      This is useful to make sure it was not inside an input/textarea
 *                - key: string         Filter (emit only) the keys that generate this string
 *                - code: number        Filter (emit only) if the keyCode matches. Some keyCodes:
 *                                        KeyA - a
 *                                        Digit0 - 0
 *                                        Enter / NumpadEnter
 *                                        Escape - Escape
 *                                        Space - Space
 *                                        Backspace / Delete
 *                                        ArrowLeft / ArrowUp / ArrowRight /  ArrowDown
 *    Example:
 *    this.jbEvents.onKeyUp({ key: 'p' }).subscribe(ev => console.log('key up', ev.code, ev.key, ev.keyCode));
 *
 */
@Injectable({ providedIn: 'root' })
export class JbEventsService {
  public click$: Subject<Event> = new Subject();
  public keyUp$: Subject<KeyboardEvent> = new Subject();
  public onEsc$: Observable<KeyboardEvent>;
  public onWindowResize$: Subject<Event> = new Subject();

  constructor(
    private eManager: EventManager,
  ) {

    // Listen globally to click events
    this.eManager.addGlobalEventListener('document', 'click', ($event) => this.click$.next($event));
    this.eManager.addGlobalEventListener('document', 'keyup', ($event) => this.keyUp$.next($event));
    this.eManager.addGlobalEventListener('window',  'resize', ($event) => this.onWindowResize$.next($event));

    this.onEsc$ = this.onKeyUp({ code: 'Escape' });
  }

  // Returns an observable that emits if the click was not inside the containers
  detectClickOutside(containers: Array<Element> | Element, options: Partial<IDetectClickOptions> = {}) {
    const aContainers = !Array.isArray(containers) ? [containers] : containers; // In case of 1 element only
    options = { ignoreTextSelection: false, usePosition: true, ...options }; // Set default options

    const click$ = this.click$.pipe(filter(($event: MouseEvent) => {

      if (options.usePosition) {
        // Calculate whether the clicked position is inside any of the containers
        // using the positioning coordinates of:
        //  - https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects
        //  - https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
        for (const container of aContainers) {
          if (!!container) {
            const rect = container.getClientRects();
            // console.log(`Click = [${$event.clientX}, ${$event.clientY}] ---- Container [left, top, right, bottom] = [${rect[0].left}, ${rect[0].top}, ${rect[0].right}, ${rect[0].bottom}]`);
            if (rect.length && $event.clientX >= rect[0].left && $event.clientX <= rect[0].right && $event.clientY >= rect[0].top && $event.clientY <= rect[0].bottom) {
              return false; // Click inside
            }
          }
        }
        return true; // Click outside

      } else {
        // Calculate whether the click was inside a child node of any of the containers
        // This may not catch every case, since the html elements can mutate and not match the $event.target
        let scanningTarget: Node = $event.target as Node;
        while (!!scanningTarget) {
          for (const container of aContainers) {
            if (container === scanningTarget) { return false; } // Click inside
          }
          scanningTarget = scanningTarget.parentNode; // Loop up til root
        }
        return true; // Click outside
      }

    }));

    if (!options.ignoreTextSelection) {
      return click$;

    } else { // If user is selecting text, ignore the click outside
      return click$.pipe(
        debounceTime(200),  // Average double click time is max .5s, but we'll give .2 to make the ux smoother
        filter(_ => !window.getSelection().toString().replace('\n', ''))
      );
    }
  }


  // Returns an observable that emits when a key is pressed (up), and it was not in an input/textarea field
  // keyCode:  a='KeyA', 3='Digit3',
  onKeyUp(options: Partial<{ key, code, onlyBody }> = { key: '', code: '', onlyBody: false }) {
    return this.keyUp$.pipe(
      filter(keyEvent => !options.onlyBody || keyEvent.target['tagName'] === 'BODY'),
      filter(keyEvent => !options.key || options.key === keyEvent.key),
      filter(keyEvent => !options.code || options.code === keyEvent.code),
    );
  }

}


