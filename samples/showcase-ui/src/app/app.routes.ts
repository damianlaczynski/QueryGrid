import { Routes } from '@angular/router';
import { PrimengShowcasePageComponent } from './primeng-showcase-page.component';
import { UiShowcasePageComponent } from './ui-showcase-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ui' },
  { path: 'primeng', component: PrimengShowcasePageComponent },
  { path: 'ui', component: UiShowcasePageComponent },
];
