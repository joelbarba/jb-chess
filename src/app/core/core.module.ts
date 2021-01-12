import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { JbUiLibModule } from 'jb-ui-lib';
import { CoreLibModule } from './core-lib/core-lib.module';


@NgModule({
  declarations: [],
  imports: [],
  exports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    TranslateModule,
    JbUiLibModule,
    CoreLibModule,
  ]
})
export class CoreModule { }


