import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import { selectSelectedWorkspace, selectWorkspaceLoading } from '../../../store/workspace/workspace.selectors';

@Component({
  selector: 'app-workspace',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './workspace.html',
  styleUrl: './workspace.css',
})
export class Workspace implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  workspace = this.store.selectSignal(selectSelectedWorkspace);
  loading = this.store.selectSignal(selectWorkspaceLoading);
  workspaceId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (id) {
      this.workspaceId.set(id);
      this.store.dispatch(WorkspaceActions.loadWorkspace({ id }));
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(WorkspaceActions.clearWorkspace());
  }
}
