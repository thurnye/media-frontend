import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { selectInitialized, selectIsLoggedIn } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store  = inject(Store);
  const router = inject(Router);

  return store.select(selectInitialized).pipe(
    filter(initialized => initialized),
    take(1),
    map(() => {
      const isLoggedIn = store.selectSignal(selectIsLoggedIn)();
      return isLoggedIn ? true : router.createUrlTree(['/login']);
    }),
  );
};
