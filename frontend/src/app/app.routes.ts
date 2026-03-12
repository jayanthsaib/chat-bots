import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'chatbots',
        loadComponent: () => import('./features/chatbots/chatbot-list/chatbot-list.component').then(m => m.ChatbotListComponent)
      },
      {
        path: 'chatbots/new',
        loadComponent: () => import('./features/chatbots/chatbot-wizard/chatbot-wizard.component').then(m => m.ChatbotWizardComponent)
      },
      {
        path: 'chatbots/:id',
        loadComponent: () => import('./features/chatbots/chatbot-detail/chatbot-detail.component').then(m => m.ChatbotDetailComponent)
      },
      {
        path: 'conversations',
        loadComponent: () => import('./features/conversations/conversation-inbox/conversation-inbox.component').then(m => m.ConversationInboxComponent)
      },
      {
        path: 'leads',
        loadComponent: () => import('./features/leads/lead-list/lead-list.component').then(m => m.LeadListComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
