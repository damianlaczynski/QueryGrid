import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ButtonComponent,
  CheckboxComponent,
  DateComponent,
  NumberComponent,
  PopoverDirective,
  SelectComponent,
  TextComponent,
  type SelectItem,
} from "@laczynski/ui";
import type { FilterCondition, FilterLogic, FilterOperator } from "@query-grid/core";
import { coerceOperatorForColumnType } from "@query-grid/core";
import { defaultOperatorForType, hasFilterValue } from "../filter-mapper";
import { QgI18nService } from "../i18n";
import { buildEnumMatchModeOptions, buildMatchModeOptions } from "../match-mode-options";
import type { GridSize } from "../types";
import type { GridColumn, GridColumnFilterType } from "./grid-column";

export type ColumnFilterApplyEvent = {
  conditions: FilterCondition[] | null;
  logic: FilterLogic;
};

type DraftRule = {
  id: number;
  operator: FilterOperator;
  value: unknown;
  valueEnd: unknown;
};

const MULTI_RULE_TYPES: GridColumnFilterType[] = ["text", "number", "date", "guid"];
const MAX_RULES = 5;

@Component({
  selector: "qg-column-filter",
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    CheckboxComponent,
    DateComponent,
    SelectComponent,
    NumberComponent,
    PopoverDirective,
    TextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./qg-column-filter.component.html",
  styleUrl: "./qg-column-filter.component.scss",
  host: {
    "(click)": "$event.stopPropagation()",
  },
})
export class QgColumnFilterComponent<T = unknown> {
  private readonly i18n = inject(QgI18nService);

  readonly column = input.required<GridColumn<T>>();
  readonly size = input<GridSize>("medium");
  readonly conditions = input<FilterCondition[]>([]);
  readonly logic = input<FilterLogic>("and");

  readonly applyFilter = output<ColumnFilterApplyEvent>();

  protected readonly popoverOpen = model(false);
  protected readonly draftRules = signal<DraftRule[]>([]);
  protected readonly draftLogic = signal<FilterLogic>("and");
  protected readonly draftBooleanTrue = signal(false);
  protected readonly draftBooleanFalse = signal(false);

  protected readonly logicItems = computed<SelectItem[]>(() => {
    this.i18n.languageVersion()();
    return [
      { label: this.i18n.t("filter.logic.matchAll", "Match All"), value: "and" },
      { label: this.i18n.t("filter.logic.matchAny", "Match Any"), value: "or" },
    ];
  });

  protected readonly matchAllPlaceholder = this.i18n.tSignal("filter.logic.matchAll", "Match All");
  protected readonly operatorPlaceholder = this.i18n.tSignal(
    "filter.operator.placeholder",
    "Operator",
  );
  protected readonly valuePlaceholder = this.i18n.tSignal("filter.value.placeholder", "Value");
  protected readonly guidPlaceholder = this.i18n.tSignal("filter.value.guid", "Guid");
  protected readonly fromPlaceholder = this.i18n.tSignal("filter.value.from", "From");
  protected readonly toPlaceholder = this.i18n.tSignal("filter.value.to", "To");
  protected readonly datePlaceholder = this.i18n.tSignal("filter.value.date", "Date");
  protected readonly anyPlaceholder = this.i18n.tSignal("filter.value.any", "Any");
  protected readonly removeRuleLabel = this.i18n.tSignal("filter.removeRule", "Remove Rule");
  protected readonly addRuleLabel = this.i18n.tSignal("filter.addRule", "Add Rule");
  protected readonly clearLabel = this.i18n.tSignal("grid.clear", "Clear");
  protected readonly applyLabel = this.i18n.tSignal("filter.apply", "Apply");

  private nextRuleId = 1;

  protected readonly isActive = computed(() => this.conditions().length > 0);

  protected readonly allowMultipleRules = computed(() => {
    const type = this.column().filter?.type;
    return type != null && MULTI_RULE_TYPES.includes(type);
  });

  protected readonly matchModeOptions = computed(() => {
    this.i18n.languageVersion()();
    const column = this.column();
    const filter = column.filter;
    if (!filter) {
      return [];
    }

    const translate = (key: string, fallback: string) => this.i18n.t(key, fallback);

    if (filter.type === "enum") {
      return buildEnumMatchModeOptions(filter.nullable, translate);
    }

    if (filter.type === "boolean") {
      return [];
    }

    return buildMatchModeOptions(filter.type, filter.nullable, translate) ?? [];
  });

  protected readonly operatorItems = computed<SelectItem[]>(() =>
    this.matchModeOptions().map((option) => ({
      label: option.label,
      value: option.value,
    })),
  );

  protected readonly enumItems = computed<SelectItem[]>(() => {
    const options = this.column().filter?.options ?? [];
    return options.map((option) => ({
      label: option.label,
      value: String(option.value),
    }));
  });

  protected readonly showOperatorSelect = computed(() => this.matchModeOptions().length > 1);

  protected readonly canAddRule = computed(
    () => this.allowMultipleRules() && this.draftRules().length < MAX_RULES,
  );

  protected readonly showLogicSelect = computed(() => this.allowMultipleRules());

  protected onPopoverOpenChange(open: boolean): void {
    if (open) {
      this.syncDraftFromConditions(this.conditions());
    }
    this.popoverOpen.set(open);
  }

  protected onLogicChange(logic: string | number): void {
    this.draftLogic.set(logic === "or" ? "or" : "and");
  }

  protected isNullOperator(operator: FilterOperator): boolean {
    return operator === "isNull" || operator === "isNotNull";
  }

  protected isBetweenOperator(operator: FilterOperator): boolean {
    return operator === "between";
  }

  protected syncDraftFromConditions(conditions: FilterCondition[]): void {
    const column = this.column();
    const filterType = column.filter?.type;
    const defaultOperator = defaultOperatorForType(filterType ?? "text");
    this.draftLogic.set(this.logic());

    if (filterType === "boolean") {
      const condition = conditions[0] ?? null;
      this.draftRules.set([this.createRule(defaultOperator)]);
      this.draftBooleanTrue.set(condition?.value === true);
      this.draftBooleanFalse.set(condition?.value === false);
      return;
    }

    if (conditions.length === 0) {
      this.draftRules.set([this.createRule(defaultOperator)]);
      this.draftBooleanTrue.set(false);
      this.draftBooleanFalse.set(false);
      return;
    }

    this.draftRules.set(
      conditions.map((condition) => this.ruleFromCondition(condition, filterType)),
    );
  }

  protected addRule(): void {
    if (!this.canAddRule()) {
      return;
    }

    const defaultOperator = defaultOperatorForType(this.column().filter?.type ?? "text");
    this.draftRules.update((rules) => [...rules, this.createRule(defaultOperator)]);
  }

  protected removeRule(ruleId: number): void {
    this.draftRules.update((rules) => {
      if (rules.length <= 1) {
        return rules;
      }
      return rules.filter((rule) => rule.id !== ruleId);
    });
  }

  protected onOperatorChange(ruleId: number, operator: string | number): void {
    const next = coerceOperatorForColumnType(
      String(operator) as FilterOperator,
      this.column().filter?.type,
      this.column().filter?.nullable,
    );
    this.draftRules.update((rules) =>
      rules.map((rule) => (rule.id === ruleId ? { ...rule, operator: next } : rule)),
    );
  }

  protected onRuleValueChange(ruleId: number, value: unknown): void {
    this.draftRules.update((rules) =>
      rules.map((rule) => (rule.id === ruleId ? { ...rule, value } : rule)),
    );
  }

  protected onRuleValueEndChange(ruleId: number, valueEnd: unknown): void {
    this.draftRules.update((rules) =>
      rules.map((rule) => (rule.id === ruleId ? { ...rule, valueEnd } : rule)),
    );
  }

  protected apply(): void {
    const column = this.column();
    const field = column.field;
    const filterType = column.filter?.type;

    if (filterType === "boolean") {
      if (this.draftBooleanTrue() && !this.draftBooleanFalse()) {
        this.applyFilter.emit({
          conditions: [{ field, operator: "eq", value: true }],
          logic: "and",
        });
      } else if (this.draftBooleanFalse() && !this.draftBooleanTrue()) {
        this.applyFilter.emit({
          conditions: [{ field, operator: "eq", value: false }],
          logic: "and",
        });
      } else {
        this.applyFilter.emit({ conditions: null, logic: "and" });
      }
      this.popoverOpen.set(false);
      return;
    }

    const nextConditions: FilterCondition[] = [];

    for (const rule of this.draftRules()) {
      const operator = rule.operator;

      if (operator === "isNull" || operator === "isNotNull") {
        nextConditions.push({ field, operator });
        continue;
      }

      let value = rule.value;
      if (operator === "between") {
        value = [rule.value, rule.valueEnd];
      }

      if (filterType === "enum" && Array.isArray(value)) {
        const options = column.filter?.options ?? [];
        value = value.map((entry) => {
          const match = options.find((option) => String(option.value) === String(entry));
          return match ? match.value : entry;
        });
      }

      if (!hasFilterValue(value)) {
        continue;
      }

      nextConditions.push({ field, operator, value });
    }

    this.applyFilter.emit({
      conditions: nextConditions.length > 0 ? nextConditions : null,
      logic: this.draftLogic(),
    });
    this.popoverOpen.set(false);
  }

  protected clear(): void {
    this.applyFilter.emit({ conditions: null, logic: "and" });
    this.popoverOpen.set(false);
  }

  protected booleanFilterTrueLabel(): string {
    this.i18n.languageVersion()();
    return this.column().filter?.trueLabel ?? this.i18n.t("filter.boolean.yes", "Yes");
  }

  protected booleanFilterFalseLabel(): string {
    this.i18n.languageVersion()();
    return this.column().filter?.falseLabel ?? this.i18n.t("filter.boolean.no", "No");
  }

  protected filterAriaLabel(): string {
    this.i18n.languageVersion()();
    return this.i18n.t("filter.aria", `Filter ${this.column().header}`, {
      header: this.column().header,
    });
  }

  protected onBooleanTrueChange(checked: boolean): void {
    this.draftBooleanTrue.set(checked);
    if (checked) {
      this.draftBooleanFalse.set(false);
    }
  }

  protected onBooleanFalseChange(checked: boolean): void {
    this.draftBooleanFalse.set(checked);
    if (checked) {
      this.draftBooleanTrue.set(false);
    }
  }

  private createRule(operator: FilterOperator): DraftRule {
    return {
      id: this.nextRuleId++,
      operator,
      value: null,
      valueEnd: null,
    };
  }

  private ruleFromCondition(
    condition: FilterCondition,
    filterType: GridColumnFilterType | undefined,
  ): DraftRule {
    const operator = coerceOperatorForColumnType(
      condition.operator,
      filterType,
      this.column().filter?.nullable,
    );

    if (operator === "between" && Array.isArray(condition.value)) {
      return {
        id: this.nextRuleId++,
        operator,
        value: condition.value[0] ?? null,
        valueEnd: condition.value[1] ?? null,
      };
    }

    if (filterType === "enum") {
      const values = Array.isArray(condition.value)
        ? condition.value.map((entry) => String(entry))
        : condition.value != null
          ? [String(condition.value)]
          : [];
      return {
        id: this.nextRuleId++,
        operator,
        value: values,
        valueEnd: null,
      };
    }

    return {
      id: this.nextRuleId++,
      operator,
      value: condition.value ?? null,
      valueEnd: null,
    };
  }
}
