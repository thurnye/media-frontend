import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
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
  private destroy$ = new Subject<void>();

  workspace = this.store.selectSignal(selectSelectedWorkspace);
  loading = this.store.selectSignal(selectWorkspaceLoading);
  workspaceId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('workspaceId')),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((id) => {
        if (!id) return;
        this.workspaceId.set(id);
        this.store.dispatch(WorkspaceActions.loadWorkspace({ id }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(WorkspaceActions.clearWorkspace());
  }
}
