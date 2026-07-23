import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from "@angular/core";

export interface QgI18nConfig {
  enabled: boolean;
  prefix: string;
}

export type QgTranslateFn = (key: string, params?: Record<string, unknown>) => string | undefined;

export const QG_I18N_CONFIG = new InjectionToken<QgI18nConfig>("QG_I18N_CONFIG", {
  providedIn: "root",
  factory: () => ({
    enabled: false,
    prefix: "qg",
  }),
});

export const QG_TRANSLATE_FN = new InjectionToken<QgTranslateFn | null>("QG_TRANSLATE_FN");

export function provideQgI18n(config: Partial<QgI18nConfig> = {}): EnvironmentProviders {
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
      useValue: null,
    },
  ]);
}
