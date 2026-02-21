import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ILogin, ISignUp, IUser } from '../../core/interfaces/auth';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Restore Session':         emptyProps(),
    'Restore Session Success': props<{ user: IUser }>(),
    'Login':          props<{ credentials: ILogin }>(),
    'Login Success':  props<{ user: IUser }>(),
    'Login Failure':  props<{ error: string }>(),
    'Signup':         props<{ input: ISignUp }>(),
    'Signup Success': props<{ user: IUser }>(),
    'Signup Failure': props<{ error: string }>(),
    'Logout':         emptyProps(),
  },
});
