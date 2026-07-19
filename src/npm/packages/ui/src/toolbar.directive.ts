import { Directive, TemplateRef, inject } from "@angular/core";

/** Optional toolbar content shown in the expandable Filters panel. */
@Directive({ selector: "[qgToolbar]", standalone: true })
export class QgToolbarDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
