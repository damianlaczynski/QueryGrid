import { Directive, ElementRef, inject, input, output } from "@angular/core";

@Directive({
  selector: "[qgColumnResize]",
  standalone: true,
  host: {
    class: "qg-column-resize-handle",
    "(mousedown)": "onMouseDown($event)",
  },
})
export class QgColumnResizeDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly minWidth = input(48);

  readonly resized = output<number>();

  private active = false;

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const header = this.elementRef.nativeElement.closest("th");
    if (!header) {
      return;
    }

    const startX = event.clientX;
    const startWidth = header.getBoundingClientRect().width;
    this.active = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.active) {
        return;
      }

      const width = Math.max(this.minWidth(), Math.round(startWidth + moveEvent.clientX - startX));
      this.resized.emit(width);
    };

    const onMouseUp = () => {
      this.active = false;
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseup", onMouseUp);
    };

    globalThis.addEventListener("mousemove", onMouseMove);
    globalThis.addEventListener("mouseup", onMouseUp);
  }
}
