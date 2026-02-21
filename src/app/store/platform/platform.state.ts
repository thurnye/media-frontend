import { IPlatformAccount } from '../../core/interfaces/platform';

export interface PlatformState {
  accounts:    IPlatformAccount[];   // workspace-linked accounts
  myAccounts:  IPlatformAccount[];   // all accounts owned by the user
  loading:     boolean;
  saving:      boolean;
  error:       string | null;
}

export const initialPlatformState: PlatformState = {
  accounts:   [],
  myAccounts: [],
  loading:    false,
  saving:     false,
  error:      null,
};
