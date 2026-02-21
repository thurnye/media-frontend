import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState  = createFeatureSelector<AuthState>('auth');

export const selectUser       = createSelector(selectAuthState, s => s.user);
export const selectLoading    = createSelector(selectAuthState, s => s.loading);
export const selectError      = createSelector(selectAuthState, s => s.error);
export const selectIsLoggedIn  = createSelector(selectUser, user => !!user);
export const selectInitialized = createSelector(selectAuthState, s => s.initialized);
