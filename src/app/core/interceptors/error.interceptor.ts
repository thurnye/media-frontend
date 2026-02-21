import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { ToastService } from '../services/toast.service';
import { GLOBAL_CONSTANTS } from '../constants/globalConstants';

const { TOAST } = GLOBAL_CONSTANTS;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store  = inject(Store);
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      // GraphQL-level errors arrive inside a 200 response body
      const gqlErrors: { message: string; extensions?: { code?: string } }[] =
        err.error?.errors ?? [];

      const gqlMessage = gqlErrors[0]?.message;
      const gqlCode    = gqlErrors[0]?.extensions?.code;

      // ── Session expiry: HTTP 401 or GraphQL UNAUTHENTICATED code ──
      const isUnauthenticated =
        err.status === 401 || gqlCode === 'UNAUTHENTICATED';

      if (isUnauthenticated) {
        store.dispatch(AuthActions.logout());
        toast.show(TOAST.SESSION_EXPIRED, 'warning');
        router.navigate(['/login']);
        return throwError(() => new Error(TOAST.SESSION_EXPIRED));
      }

      // ── Derive a human-readable message for other errors ──
      let message = gqlMessage ?? 'An unexpected error occurred';

      if (!gqlMessage) {
        if (err.status === 0)        message = TOAST.NETWORK_ERROR;
        else if (err.status === 403) message = TOAST.PERMISSION_DENIED;
        else if (err.status >= 500)  message = TOAST.UNEXPECTED_ERROR;
      }

      console.error('[HTTP Error]', message, err);
      return throwError(() => new Error(message));
    }),
  );
};
