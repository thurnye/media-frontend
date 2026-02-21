import { IPlatformAccount } from '../../core/interfaces/platform';

export interface PlatformState {
  accounts: IPlatformAccount[];
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
}

export const initialPlatformState: PlatformState = {
  accounts: [],
  loading:  false,
  saving:   false,
  error:    null,
};
