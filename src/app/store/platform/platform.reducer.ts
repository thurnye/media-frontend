import { createReducer, on } from '@ngrx/store';
import { PlatformActions } from './platform.actions';
import { initialPlatformState } from './platform.state';
import { AuthActions } from '../auth/auth.actions';

export const platformReducer = createReducer(
  initialPlatformState,

  // Load workspace accounts
  on(PlatformActions.loadPlatformAccounts,        state                  => ({ ...state, loading: true,  error: null })),
  on(PlatformActions.loadPlatformAccountsSuccess, (state, { accounts }) => ({ ...state, loading: false, accounts })),
  on(PlatformActions.loadPlatformAccountsFailure, (state, { error })    => ({ ...state, loading: false, error })),

  // Load user's full account list
  on(PlatformActions.loadMyPlatformAccounts,        state                  => ({ ...state, loading: true,  error: null })),
  on(PlatformActions.loadMyPlatformAccountsSuccess, (state, { accounts }) => ({ ...state, loading: false, myAccounts: accounts })),
  on(PlatformActions.loadMyPlatformAccountsFailure, (state, { error })    => ({ ...state, loading: false, error })),

  // Link — add to workspace-scoped list
  on(PlatformActions.linkPlatformAccount,        state                => ({ ...state, saving: true,  error: null })),
  on(PlatformActions.linkPlatformAccountSuccess, (state, { account }) => ({
    ...state, saving: false,
    accounts: state.accounts.some(a => a.id === account.id)
      ? state.accounts.map(a => a.id === account.id ? account : a)
      : [...state.accounts, account],
    myAccounts: state.myAccounts.map(a => a.id === account.id ? account : a),
  })),
  on(PlatformActions.linkPlatformAccountFailure, (state, { error }) => ({ ...state, saving: false, error })),

  // Unlink — remove from workspace-scoped list
  on(PlatformActions.unlinkPlatformAccount,        state                => ({ ...state, saving: true,  error: null })),
  on(PlatformActions.unlinkPlatformAccountSuccess, (state, { account }) => ({
    ...state, saving: false,
    accounts:   state.accounts.filter(a => a.id !== account.id),
    myAccounts: state.myAccounts.map(a => a.id === account.id ? account : a),
  })),
  on(PlatformActions.unlinkPlatformAccountFailure, (state, { error }) => ({ ...state, saving: false, error })),

  // Hard disconnect
  on(PlatformActions.disconnectPlatformAccount,        state                => ({ ...state, saving: true,  error: null })),
  on(PlatformActions.disconnectPlatformAccountSuccess, (state, { account }) => ({
    ...state, saving: false,
    accounts:   state.accounts.map(a => a.id === account.id ? { ...a, ...account } : a),
    myAccounts: state.myAccounts.map(a => a.id === account.id ? { ...a, ...account } : a),
  })),
  on(PlatformActions.disconnectPlatformAccountFailure, (state, { error }) => ({ ...state, saving: false, error })),

  // Clear
  on(PlatformActions.clearPlatformAccounts, () => initialPlatformState),
  on(AuthActions.logout, () => initialPlatformState),
);
