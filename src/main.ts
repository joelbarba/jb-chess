import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

import 'bootstrap';

// Initialize prototypes
import {JbPrototypes} from 'jb-ui-lib';
JbPrototypes.run();  // Extend all common prototypes
