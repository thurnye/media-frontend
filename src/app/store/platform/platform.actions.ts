import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IPlatformAccount } from '../../core/interfaces/platform';

export const PlatformActions = createActionGroup({
  source: 'Platform',
  events: {
    // Load workspace-linked accounts
    'Load Platform Accounts':         props<{ workspaceId: string }>(),
    'Load Platform Accounts Success': props<{ accounts: IPlatformAccount[] }>(),
    'Load Platform Accounts Failure': props<{ error: string }>(),

    // Load all user-owned accounts (for connect dialog)
    'Load My Platform Accounts':         emptyProps(),
    'Load My Platform Accounts Success': props<{ accounts: IPlatformAccount[] }>(),
    'Load My Platform Accounts Failure': props<{ error: string }>(),

    // Link an existing account to a workspace
    'Link Platform Account':         props<{ accountId: string; workspaceId: string }>(),
    'Link Platform Account Success': props<{ account: IPlatformAccount }>(),
    'Link Platform Account Failure': props<{ error: string }>(),

    // Unlink an account from a workspace
    'Unlink Platform Account':         props<{ accountId: string; workspaceId: string }>(),
    'Unlink Platform Account Success': props<{ account: IPlatformAccount }>(),
    'Unlink Platform Account Failure': props<{ error: string }>(),

    // Full disconnect (owner revoking entirely)
    'Disconnect Platform Account':         props<{ id: string }>(),
    'Disconnect Platform Account Success': props<{ account: IPlatformAccount }>(),
    'Disconnect Platform Account Failure': props<{ error: string }>(),

    // Cleanup
    'Clear Platform Accounts': emptyProps(),
  },
});
