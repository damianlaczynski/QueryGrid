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

  :host .qg-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
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
