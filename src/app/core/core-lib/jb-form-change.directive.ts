import {AfterViewInit, Directive, EventEmitter, OnDestroy, Output} from '@angular/core';
import {NgForm} from '@angular/forms';

/***
 * Automatically detects when the form changes, and emits the new values
 *
 *    <form #detailsForm="ngForm" (jjBormChange)="doSomething($event)">
 */
@Directive({ selector: '[jjBormChange]' })
export class JjBormChangeDirective implements AfterViewInit, OnDestroy {
  @Output() jjBormChange = new EventEmitter();
  private sub;
  constructor(private ngForm: NgForm) {}
  ngAfterViewInit() {
    this.sub = this.ngForm.form.valueChanges.subscribe(value => this.jjBormChange.emit(value));
  }
  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
  }
}
