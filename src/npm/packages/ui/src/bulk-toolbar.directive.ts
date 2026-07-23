import { Directive, TemplateRef, inject } from "@angular/core";

/** Bulk action buttons shown when one or more rows are selected. */
@Directive({ selector: "[qgBulkToolbar]", standalone: true })
export class QgBulkToolbarDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
