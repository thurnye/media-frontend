import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace } from '../../../store/workspace/workspace.selectors';

@Component({
  selector: 'app-workspace-analytics',
  imports: [],
  templateUrl: './workspace-analytics.html',
  styleUrl: './workspace-analytics.css',
})
export class WorkspaceAnalytics {
  private store = inject(Store);
  workspace = this.store.selectSignal(selectSelectedWorkspace);
}
