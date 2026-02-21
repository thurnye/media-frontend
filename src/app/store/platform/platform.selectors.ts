import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PlatformState } from './platform.state';

export const selectPlatformState = createFeatureSelector<PlatformState>('platform');

export const selectPlatformAccounts    = createSelector(selectPlatformState, s => s.accounts);
export const selectMyPlatformAccounts  = createSelector(selectPlatformState, s => s.myAccounts);
export const selectActiveAccountCount  = createSelector(selectPlatformState, s => s.accounts.filter(a => a.status === 'active').length);
export const selectPlatformLoading     = createSelector(selectPlatformState, s => s.loading);
export const selectPlatformSaving      = createSelector(selectPlatformState, s => s.saving);
export const selectPlatformError       = createSelector(selectPlatformState, s => s.error);
