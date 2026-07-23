import { TranslateService } from '@ngx-translate/core';
import { ShowcaseCategory } from '../models/showcase-row.model';

export function showcaseCategories(translate: TranslateService) {
  return [
    { label: translate.instant('showcase.categories.alpha'), value: ShowcaseCategory.Alpha },
    { label: translate.instant('showcase.categories.beta'), value: ShowcaseCategory.Beta },
    { label: translate.instant('showcase.categories.gamma'), value: ShowcaseCategory.Gamma },
    { label: translate.instant('showcase.categories.delta'), value: ShowcaseCategory.Delta },
    { label: translate.instant('showcase.categories.epsilon'), value: ShowcaseCategory.Epsilon },
  ];
}

export function getShowcaseCategoryLabel(
  category: ShowcaseCategory,
  translate: TranslateService,
): string {
  const keys: Record<ShowcaseCategory, string> = {
    [ShowcaseCategory.Alpha]: 'showcase.categories.alpha',
    [ShowcaseCategory.Beta]: 'showcase.categories.beta',
    [ShowcaseCategory.Gamma]: 'showcase.categories.gamma',
    [ShowcaseCategory.Delta]: 'showcase.categories.delta',
    [ShowcaseCategory.Epsilon]: 'showcase.categories.epsilon',
  };

  return translate.instant(keys[category]);
}
