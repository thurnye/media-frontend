import { IUser } from '../../core/interfaces/auth';

export interface AuthState {
  user:        IUser | null;
  loading:     boolean;
  error:       string | null;
  initialized: boolean;
}

export const initialAuthState: AuthState = {
  user:        null,
  loading:     false,
  error:       null,
  initialized: false,
};
