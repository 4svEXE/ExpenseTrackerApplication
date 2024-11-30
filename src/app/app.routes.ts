import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'new-transaction',
    redirectTo: 'new-transaction/categories/income',
  },
  {
    path: 'new-transaction/categories/:type',
    loadComponent: () =>
      import('./pages/new-transaction/new-transaction.component').then((m) => m.NewTransactionComponent),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
