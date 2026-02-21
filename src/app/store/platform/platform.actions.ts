import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IPlatformAccount } from '../../core/interfaces/platform';
import { IConnectPlatformAccountInput } from '../../core/services/platform.gql.service';

export const PlatformActions = createActionGroup({
  source: 'Platform',
  events: {
    // Load all for workspace
    'Load Platform Accounts':         props<{ workspaceId: string }>(),
    'Load Platform Accounts Success': props<{ accounts: IPlatformAccount[] }>(),
    'Load Platform Accounts Failure': props<{ error: string }>(),

    // Connect
    'Connect Platform Account':         props<{ input: IConnectPlatformAccountInput }>(),
    'Connect Platform Account Success': props<{ account: IPlatformAccount }>(),
    'Connect Platform Account Failure': props<{ error: string }>(),

    // Disconnect
    'Disconnect Platform Account':         props<{ id: string }>(),
    'Disconnect Platform Account Success': props<{ account: IPlatformAccount }>(),
    'Disconnect Platform Account Failure': props<{ error: string }>(),

    // Cleanup
    'Clear Platform Accounts': emptyProps(),
  },
});
