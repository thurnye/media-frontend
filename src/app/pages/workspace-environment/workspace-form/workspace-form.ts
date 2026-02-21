import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import {
  selectSelectedWorkspace,
  selectWorkspaceError,
  selectWorkspaceLoading,
  selectWorkspaceSaving,
} from '../../../store/workspace/workspace.selectors';
import { GLOBAL_CONSTANTS } from '../../../core/constants/globalConstants';

@Component({
  selector: 'app-workspace-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './workspace-form.html',
  styleUrl: './workspace-form.css',
})
export class WorkspaceForm implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  readonly timezones = GLOBAL_CONSTANTS.TIME_ZONES;
  readonly plans = [
    { value: 'free',       label: 'Free',       desc: 'For individuals and small teams' },
    { value: 'pro',        label: 'Pro',        desc: 'Advanced features and more storage' },
    { value: 'enterprise', label: 'Enterprise', desc: 'Custom limits and dedicated support' },
  ];

  workspaceId = signal<string | null>(null);
  isEdit      = signal(false);

  name            = '';
  slug            = '';
  description     = '';
  defaultTimezone = 'Etc/UTC';
  plan            = 'free';

  approvalRequired   = false;
  evergreenEnabled   = false;
  autoPublishEnabled = false;

  loading   = this.store.selectSignal(selectWorkspaceLoading);
  saving    = this.store.selectSignal(selectWorkspaceSaving);
  error     = this.store.selectSignal(selectWorkspaceError);
  workspace = this.store.selectSignal(selectSelectedWorkspace);

  constructor() {
    effect(() => {
      const ws = this.workspace();
      if (ws && this.isEdit()) {
        this.name            = ws.name;
        this.slug            = ws.slug ?? '';
        this.description     = ws.description ?? '';
        this.defaultTimezone = ws.defaultTimezone ?? 'Etc/UTC';
        this.plan            = ws.plan ?? 'free';
        this.approvalRequired   = ws.settings?.approvalRequired   ?? false;
        this.evergreenEnabled   = ws.settings?.evergreenEnabled   ?? false;
        this.autoPublishEnabled = ws.settings?.autoPublishEnabled ?? false;
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (id) {
      this.workspaceId.set(id);
      this.isEdit.set(true);
      this.store.dispatch(WorkspaceActions.loadWorkspace({ id }));
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(WorkspaceActions.clearWorkspace());
  }

  generateSlug(): void {
    if (!this.isEdit()) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  onSubmit(): void {
    if (!this.name.trim() || !this.slug.trim()) return;

    const settings = {
      approvalRequired:   this.approvalRequired,
      evergreenEnabled:   this.evergreenEnabled,
      autoPublishEnabled: this.autoPublishEnabled,
    };

    if (this.isEdit()) {
      this.store.dispatch(WorkspaceActions.updateWorkspace({
        input: {
          id:              this.workspaceId()!,
          name:            this.name.trim(),
          slug:            this.slug.trim(),
          description:     this.description.trim() || undefined,
          defaultTimezone: this.defaultTimezone,
          plan:            this.plan,
          settings,
        },
      }));
    } else {
      this.store.dispatch(WorkspaceActions.createWorkspace({
        input: {
          name:            this.name.trim(),
          slug:            this.slug.trim(),
          description:     this.description.trim() || undefined,
          defaultTimezone: this.defaultTimezone,
          plan:            this.plan,
          settings,
        },
      }));
    }
  }
}
