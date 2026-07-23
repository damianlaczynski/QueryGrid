import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import {
  provideQgI18n,
  QG_I18N_CONFIG,
  QG_TRANSLATE_FN,
  QgI18nService,
  type QgI18nConfig,
} from "@query-grid/primeng";

export function provideQgI18nWithNgxTranslate(
  config: Partial<QgI18nConfig> = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: QG_I18N_CONFIG,
      useValue: {
        enabled: true,
        prefix: "qg",
        ...config,
      } satisfies QgI18nConfig,
    },
    {
      provide: QG_TRANSLATE_FN,
      deps: [TranslateService],
      useFactory: (translate: TranslateService) => {
        return (key: string, params?: Record<string, unknown>) => {
          return translate.instant(key, params);
        };
      },
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const translate = inject(TranslateService);
        const qgI18n = inject(QgI18nService);
        translate.onLangChange.subscribe(() => qgI18n.notifyLanguageChanged());
      },
    },
  ]);
}

export { provideQgI18n };
