import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login,          state         => ({ ...state, loading: true,  error: null })),
  on(AuthActions.loginSuccess,          (state, { user }) => ({ ...state, loading: false, user })),
  on(AuthActions.restoreSessionSuccess, (state, { user }) => ({ ...state, user, initialized: true })),
  on(AuthActions.loginFailure,   (state, { error }) => ({ ...state, loading: false, error })),
  on(AuthActions.signup,         state         => ({ ...state, loading: true,  error: null })),
  on(AuthActions.signupSuccess,  (state, { user }) => ({ ...state, loading: false, user })),
  on(AuthActions.signupFailure,  (state, { error }) => ({ ...state, loading: false, error })),
  on(AuthActions.logout,         ()            => ({ ...initialAuthState, initialized: true })),
);
