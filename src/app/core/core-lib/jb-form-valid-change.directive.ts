import {AfterViewInit, Directive, EventEmitter, OnDestroy, Output} from '@angular/core';
import {NgForm} from '@angular/forms';

/***
 * Automatically detects when the status of the ngForm changes from valid / invalid
 * It emits the valid (true/false) status of the ngForm, located on the same node
 *
 *    <form #detailsForm="ngForm" (jjBormValidChange)="doSomething($event)">
 */
@Directive({ selector: '[jjBormValidChange]' })
export class JfFormValidChangeDirective implements AfterViewInit, OnDestroy {
  @Output() jjBormValidChange = new EventEmitter();
  private sub;
  private isValid;
  constructor(private ngForm: NgForm) {}
  ngAfterViewInit() {
    this.sub = this.ngForm.form.valueChanges.subscribe(value => {
      // If it's changing status (valid - invalid)
      if (this.isValid !== this.ngForm.valid) { this.jjBormValidChange.emit(this.ngForm.valid); }
      this.isValid = this.ngForm.valid;
    });
  }
  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
  }
}
