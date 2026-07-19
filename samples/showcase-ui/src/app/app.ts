import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="shell__header">
        <div class="shell__brand">
          <span class="shell__title">QueryGrid Showcase</span>
          <span class="shell__subtitle">Compatibility matrix for grid adapters</span>
        </div>
        <nav class="shell__nav" aria-label="Showcase adapters">
          <a routerLink="/ui" routerLinkActive="is-active">laczynski/ui</a>
          <a routerLink="/primeng" routerLinkActive="is-active">PrimeNG</a>
        </nav>
      </header>
      <main class="shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.css',
})
export class App {}
