import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'wallets',
    loadComponent: () =>
      import('./pages/wallets/wallets.component').then((m) => m.WalletsComponent),
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
  {
    path: 'frog',
    loadComponent: () =>
      import('./pages/frog-game/frog-game.component').then((m) => m.FrogGameComponent),
  },
  {
    path: 'ai-chat',
    loadComponent: () =>
      import('./components/ui/ai-chat/ai-chat.component').then((m) => m.AiChatComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
