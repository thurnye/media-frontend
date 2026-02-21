import { createReducer, on } from '@ngrx/store';
import { PlatformActions } from './platform.actions';
import { initialPlatformState } from './platform.state';
import { AuthActions } from '../auth/auth.actions';

export const platformReducer = createReducer(
  initialPlatformState,

  // Load all
  on(PlatformActions.loadPlatformAccounts,        state                  => ({ ...state, loading: true,  error: null })),
  on(PlatformActions.loadPlatformAccountsSuccess, (state, { accounts }) => ({ ...state, loading: false, accounts })),
  on(PlatformActions.loadPlatformAccountsFailure, (state, { error })    => ({ ...state, loading: false, error })),

  // Connect
  on(PlatformActions.connectPlatformAccount,        state                 => ({ ...state, saving: true,  error: null })),
  on(PlatformActions.connectPlatformAccountSuccess, (state, { account })  => ({
    ...state, saving: false,
    accounts: [...state.accounts, account],
  })),
  on(PlatformActions.connectPlatformAccountFailure, (state, { error })    => ({ ...state, saving: false, error })),

  // Disconnect — update status in-place (soft-delete on backend)
  on(PlatformActions.disconnectPlatformAccount,        state                => ({ ...state, saving: true,  error: null })),
  on(PlatformActions.disconnectPlatformAccountSuccess, (state, { account }) => ({
    ...state, saving: false,
    accounts: state.accounts.map(a => a.id === account.id ? { ...a, ...account } : a),
  })),
  on(PlatformActions.disconnectPlatformAccountFailure, (state, { error })   => ({ ...state, saving: false, error })),

  // Clear
  on(PlatformActions.clearPlatformAccounts, () => initialPlatformState),
  on(AuthActions.logout, () => initialPlatformState),
);
