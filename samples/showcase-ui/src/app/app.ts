import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ShowcaseLocaleService, type ShowcaseLanguage } from './services/showcase-locale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="shell">
      <header class="shell__header">
        <div class="shell__brand">
          <span class="shell__title">{{ 'showcase.shell.title' | translate }}</span>
          <span class="shell__subtitle">{{ 'showcase.shell.subtitle' | translate }}</span>
        </div>
        <div class="shell__actions">
          <div
            class="shell__lang"
            role="group"
            [attr.aria-label]="'showcase.shell.languageAria' | translate"
          >
            <button
              type="button"
              class="shell__lang-button"
              [class.is-active]="locale.language() === 'pl'"
              [attr.aria-pressed]="locale.language() === 'pl'"
              (click)="setLanguage('pl')"
            >
              {{ 'showcase.shell.languagePl' | translate }}
            </button>
            <button
              type="button"
              class="shell__lang-button"
              [class.is-active]="locale.language() === 'en'"
              [attr.aria-pressed]="locale.language() === 'en'"
              (click)="setLanguage('en')"
            >
              {{ 'showcase.shell.languageEn' | translate }}
            </button>
          </div>
          <nav class="shell__nav" [attr.aria-label]="'showcase.shell.navAria' | translate">
            <a routerLink="/ui" routerLinkActive="is-active">{{
              'showcase.shell.uiAdapter' | translate
            }}</a>
            <a routerLink="/primeng" routerLinkActive="is-active">{{
              'showcase.shell.primengAdapter' | translate
            }}</a>
          </nav>
        </div>
      </header>
      <main class="shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.css',
})
export class App {
  protected readonly locale = inject(ShowcaseLocaleService);

  setLanguage(lang: ShowcaseLanguage): void {
    void this.locale.setLanguage(lang);
  }
}
