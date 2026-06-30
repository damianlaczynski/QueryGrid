export enum ShowcaseCategory {
  Alpha = 0,
  Beta = 1,
  Gamma = 2,
  Delta = 3,
  Epsilon = 4,
}

export interface ShowcaseRow {
  id: number;
  label: string;
  optionalNote: string | null;
  quantity: number;
  bigNumber: number;
  price: number;
  score: number;
  isActive: boolean;
  occurredAt: string;
  occurredAtOffset: string;
  occurredOn: string;
  category: ShowcaseCategory;
  referenceId: string;
  sortDisabledField: string;
  filterDisabledField: string;
  nullableDate: string | null;
}
