import {NgModule} from '@angular/core';
import {JbDatePipe} from './jb-date.pipe';
import {JfFormValidChangeDirective} from './jb-form-valid-change.directive';
import {JjBormChangeDirective} from './jb-form-change.directive';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    JbDatePipe,
    JfFormValidChangeDirective,
    JjBormChangeDirective,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NgbModule,
  ],
  exports: [
    JbDatePipe,
    JfFormValidChangeDirective,
    JjBormChangeDirective,
  ]
})
export class CoreLibModule { }
