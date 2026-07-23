export const GRID_TABLE_STYLES = `
  :host {
    display: block;
  }

  :host.qg-scrollable {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
  }

  :host.qg-scrollable .p-datatable {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
  }

  :host .qg-caption {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  :host .qg-caption-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }

  :host .qg-caption-search {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 28rem;
  }

  :host .qg-caption-search input {
    width: 100%;
  }

  :host .qg-caption-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  :host .qg-caption-filters {
    border: 1px solid var(--p-content-border-color, #e2e8f0);
    border-radius: var(--p-border-radius, 0.375rem);
    padding: 1rem;
  }

  :host .qg-caption-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  :host .qg-caption-bulk-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--p-primary-color, #3b82f6);
    border-radius: var(--p-border-radius, 0.375rem);
    background: color-mix(in srgb, var(--p-primary-color, #3b82f6) 8%, transparent);
  }

  :host .qg-caption-bulk-toolbar-count {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--p-text-color, #0f172a);
    white-space: nowrap;
  }

  :host .qg-caption-bulk-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  :host .qg-header-cell--selection,
  :host .qg-body-cell--selection {
    width: 2.75rem;
    min-width: 2.75rem;
    max-width: 2.75rem;
    padding: 0 !important;
    text-align: center;
    vertical-align: middle;
  }

  :host .qg-selection-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 2.75rem;
  }

  :host .qg-body-cell--selection .qg-selection-cell {
    min-height: 2.5rem;
  }

  :host .qg-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
  }

  :host .qg-column-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  :host .qg-column-drag-handle {
    display: inline-flex;
    align-items: center;
    color: var(--p-text-muted-color, #64748b);
    cursor: grab;
    flex-shrink: 0;
    opacity: 0;
    border-radius: 0.25rem;
    padding: 0.125rem;
    transition:
      opacity 150ms ease,
      color 150ms ease,
      background-color 150ms ease;
  }

  :host .qg-header-cell--reorderable:hover .qg-column-drag-handle,
  :host .qg-header-cell.cdk-drag-dragging .qg-column-drag-handle,
  :host .qg-header-row--dragging .qg-column-drag-handle {
    opacity: 1;
  }

  :host .qg-column-drag-handle:hover {
    color: var(--p-text-color, #0f172a);
    background: var(--p-content-hover-background, #f1f5f9);
  }

  :host .qg-column-drag-handle:active {
    cursor: grabbing;
  }

  :host .qg-header-cell.cdk-drag-dragging {
    z-index: 50 !important;
    overflow: hidden;
    opacity: 0;
  }

  :host .qg-header-cell.cdk-drag-placeholder {
    opacity: 1;
    background: color-mix(in srgb, var(--p-primary-color, #3b82f6) 8%, transparent);
    outline: 1px dashed var(--p-primary-color, #3b82f6);
    outline-offset: -1px;
  }

  :host .qg-header-cell.cdk-drag-placeholder .qg-column-header {
    visibility: hidden;
  }

  :host .qg-header-cell.cdk-drag-animating {
    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
  }

  :host .qg-header-row.cdk-drop-list-dragging .qg-header-cell:not(.cdk-drag-placeholder) {
    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
  }

  .qg-column-drag-preview {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: auto !important;
    min-height: 2.25rem;
    max-height: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 24px rgb(15 23 42 / 16%);
    color: #0f172a;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25;
    cursor: grabbing;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .qg-column-drag-preview.cdk-drag-preview {
    overflow: hidden;
  }

  :host .qg-column-pin-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 0;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--p-text-muted-color, #64748b);
    cursor: pointer;
  }

  :host .qg-column-pin-button--active {
    color: var(--p-primary-color, #3b82f6);
  }

  :host ::ng-deep .p-datatable-scrollable-table > .p-datatable-thead {
    z-index: 40;
  }

  :host .p-datatable-thead > tr > th {
    background: var(--p-datatable-header-background, var(--p-content-background, #ffffff));
  }

  :host .p-datatable-thead > tr > .qg-header-cell--selection,
  :host .p-datatable-thead > tr > .qg-header-cell.qg-pinned-left,
  :host .p-datatable-thead > tr > .qg-header-cell.qg-pinned-right {
    top: 0;
  }

  :host .qg-header-cell:not(.qg-pinned-left):not(.qg-pinned-right):not(.qg-header-cell--selection),
  :host .qg-body-cell:not(.qg-pinned-left):not(.qg-pinned-right):not(.qg-body-cell--selection) {
    position: relative;
  }

  :host .qg-header-cell.qg-pinned-left,
  :host .qg-header-cell.qg-pinned-right {
    position: sticky;
    background: var(--p-content-background, #ffffff);
    border-right: none;
  }

  :host .qg-body-cell.qg-pinned-left,
  :host .qg-body-cell.qg-pinned-right {
    position: sticky;
    background: var(--p-content-background, #ffffff);
    border-right: none;
  }

  :host .qg-header-cell--selection,
  :host .qg-body-cell--selection {
    position: sticky;
    left: 0;
    border-right: none;
  }

  :host .qg-header-cell--selection-edge,
  :host .qg-body-cell--selection-edge {
    box-shadow:
      inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      4px 0 6px -2px color-mix(in srgb, var(--p-content-border-color, #e2e8f0) 50%, transparent);
  }

  :host .qg-header-cell--selection-separator,
  :host .qg-body-cell--selection-separator {
    box-shadow: inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0);
  }

  :host .qg-header-cell--selection {
    background: var(--p-datatable-header-background, var(--p-content-background, #ffffff));
  }

  :host .qg-body-cell--selection {
    background: var(--p-content-background, #ffffff);
  }

  :host .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > .qg-body-cell--selection {
    background: var(--p-datatable-row-striped-background, #f8fafc);
  }

  :host .p-datatable-tbody > tr:hover > .qg-body-cell--selection {
    background: var(--p-datatable-row-hover-background, #f1f5f9);
  }

  :host .p-datatable-tbody > tr.qg-row--selected > .qg-body-cell--selection {
    background: color-mix(in srgb, var(--p-primary-color, #3b82f6) 10%, transparent);
  }

  :host .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > .qg-body-cell.qg-pinned-left,
  :host .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > .qg-body-cell.qg-pinned-right {
    background: var(--p-datatable-row-striped-background, #f8fafc);
  }

  :host .p-datatable-tbody > tr:hover > .qg-body-cell.qg-pinned-left,
  :host .p-datatable-tbody > tr:hover > .qg-body-cell.qg-pinned-right {
    background: var(--p-datatable-row-hover-background, #f1f5f9);
  }

  :host .qg-header-cell.qg-pinned-left-separator,
  :host .qg-body-cell.qg-pinned-left-separator {
    box-shadow: inset 1px 0 0 0 var(--p-content-border-color, #e2e8f0);
  }

  :host .qg-header-cell.qg-pinned-left-edge,
  :host .qg-body-cell.qg-pinned-left-edge {
    box-shadow:
      inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      4px 0 6px -2px color-mix(in srgb, var(--p-content-border-color, #e2e8f0) 50%, transparent);
  }

  :host .qg-header-cell.qg-pinned-left-separator.qg-pinned-left-edge,
  :host .qg-body-cell.qg-pinned-left-separator.qg-pinned-left-edge {
    box-shadow:
      inset 1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      4px 0 6px -2px color-mix(in srgb, var(--p-content-border-color, #e2e8f0) 50%, transparent);
  }

  :host .qg-header-cell.qg-pinned-right-separator,
  :host .qg-body-cell.qg-pinned-right-separator {
    box-shadow: inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0);
  }

  :host .qg-header-cell.qg-pinned-right-edge,
  :host .qg-body-cell.qg-pinned-right-edge {
    box-shadow:
      inset 1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      -4px 0 6px -2px color-mix(in srgb, var(--p-content-border-color, #e2e8f0) 50%, transparent);
  }

  :host .qg-header-cell.qg-pinned-right-separator.qg-pinned-right-edge,
  :host .qg-body-cell.qg-pinned-right-separator.qg-pinned-right-edge {
    box-shadow:
      inset 1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      inset -1px 0 0 0 var(--p-content-border-color, #e2e8f0),
      -4px 0 6px -2px color-mix(in srgb, var(--p-content-border-color, #e2e8f0) 50%, transparent);
  }

  :host .qg-column-resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    width: 0.375rem;
    height: 100%;
    cursor: col-resize;
    touch-action: none;
  }

  :host .qg-column-resize-handle:hover {
    background: color-mix(in srgb, var(--p-primary-color, #3b82f6) 35%, transparent);
  }

  :host .qg-column-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :host.qg-appearance-plain .qg-plain-caption {
    margin-bottom: 0.75rem;
  }

  :host.qg-appearance-plain .p-datatable {
    border: 1px solid var(--p-content-border-color, #e2e8f0);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  :host.qg-appearance-plain .p-datatable-thead > tr > th {
    background: var(--p-content-hover-background, #f8fafc);
    font-size: 0.875rem;
  }

  :host.qg-appearance-plain .p-datatable-tbody > tr > td {
    font-size: 0.875rem;
  }
`;
