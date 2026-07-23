import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeEn from '@angular/common/locales/en';
import localePl from '@angular/common/locales/pl';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideUiI18n, UI_TRANSLATE_FN } from '@laczynski/ui';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import Aura from '@primeuix/themes/aura';
import { provideQgI18nWithNgxTranslate } from '@query-grid/ui/ngx-translate';
import { pl } from 'primelocale/js/pl.js';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { ShowcaseLocaleService } from './services/showcase-locale.service';

registerLocaleData(localePl);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideUiI18n(),
    {
      provide: UI_TRANSLATE_FN,
      deps: [TranslateService],
      useFactory: (translate: TranslateService) => {
        return (key: string, params?: Record<string, unknown>) => translate.instant(key, params);
      },
    },
    provideTranslateService({
      lang: 'pl',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    provideQgI18nWithNgxTranslate({ prefix: 'qg' }),
    provideAppInitializer(() => inject(ShowcaseLocaleService).init()),
    providePrimeNG({
      ripple: true,
      translation: pl,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
};
