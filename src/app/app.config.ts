import { ApplicationConfig, ErrorHandler, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

import { routes } from './app.routes';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { postReducer } from './store/post/post.reducer';
import { PostEffects } from './store/post/post.effects';
import { workspaceReducer } from './store/workspace/workspace.reducer';
import { WorkspaceEffects } from './store/workspace/workspace.effects';
import { platformReducer } from './store/platform/platform.reducer';
import { PlatformEffects } from './store/platform/platform.effects';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { environment } from '../environments/environment.development';

const getCookie = (name: string): string | null => {
  const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideStore({ auth: authReducer, post: postReducer, workspace: workspaceReducer, platform: platformReducer }),
    provideEffects(AuthEffects, PostEffects, WorkspaceEffects, PlatformEffects),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const csrfLink = setContext((_, { headers }) => {
        const csrfToken = getCookie('csrf_token');
        if (!csrfToken) {
          return { headers };
        }
        return {
          headers: { 'x-csrf-token': csrfToken } as any,
        };
      });
      return {
        link: ApolloLink.from([
          csrfLink,
          httpLink.create({
            uri: environment.API_URL,
            withCredentials: true, // sends the HttpOnly cookie on every request
          }),
        ]),
        cache: new InMemoryCache(),
      };
    }),
  ],
};
