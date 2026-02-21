import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { PostForm } from './pages/post/post-form/post-form';
import { PostList } from './pages/post/post-list/post-list';
import { PostDetail } from './pages/post/post-detail/post-detail';
import { authGuard } from './core/guards/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { DashboardHome } from './pages/dashboard/dashboard-home/dashboard-home';
import { ErrorPage } from './pages/error/error-page';
import { WorkspaceForm } from './pages/workspace-environment/workspace-form/workspace-form';
import { WorkspaceHome } from './pages/workspace-environment/workspace-home/workspace-home';
import { Workspace } from './pages/workspace-environment/workspace/workspace';
import { WorkspaceMembers } from './pages/workspace-environment/workspace-members/workspace-members';
import { WorkspaceAnalytics } from './pages/workspace-environment/workspace-analytics/workspace-analytics';
import { WorkspaceSettings } from './pages/workspace-environment/workspace-settings/workspace-settings';
import { AcceptInvite } from './pages/invite/accept-invite';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'invite/accept',
    component: AcceptInvite,
  },
  {
    path: 'error',
    component: ErrorPage,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],

    children: [
      { path: '', component: DashboardHome },
      { path: 'workspace/new', component: WorkspaceForm },
      { path: 'workspace/:workspaceId/edit', component: WorkspaceForm },
      {
        path: 'workspace/:workspaceId',
        component: Workspace,
        children: [
          { path: '', component: WorkspaceHome },
          { path: 'posts', component: PostList },
          { path: 'post/new', component: PostForm },
          { path: 'post/:postId', component: PostDetail },
          { path: 'post/:postId/edit', component: PostForm },
          { path: 'members', component: WorkspaceMembers },
          { path: 'analytics', component: WorkspaceAnalytics },
          { path: 'settings', component: WorkspaceSettings },
        ],
      },
    ],
  },
];
