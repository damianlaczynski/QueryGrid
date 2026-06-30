import { ShowcaseCategory } from '../models/showcase-row.model';

export const showcaseCategories = () => [
  { label: 'Alpha', value: ShowcaseCategory.Alpha },
  { label: 'Beta', value: ShowcaseCategory.Beta },
  { label: 'Gamma', value: ShowcaseCategory.Gamma },
  { label: 'Delta', value: ShowcaseCategory.Delta },
  { label: 'Epsilon', value: ShowcaseCategory.Epsilon },
];

export function getShowcaseCategoryLabel(category: ShowcaseCategory): string {
  return showcaseCategories().find((entry) => entry.value === category)?.label ?? String(category);
}
