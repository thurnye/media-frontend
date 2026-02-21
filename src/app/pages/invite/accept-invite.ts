import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser } from '../../store/auth/auth.selectors';
import { WorkspaceActions } from '../../store/workspace/workspace.actions';

@Component({
  selector: 'app-accept-invite',
  templateUrl: './accept-invite.html',
  styleUrl: './accept-invite.css',
})
export class AcceptInvite implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  user = this.store.selectSignal(selectUser);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (this.user()) {
      // User is logged in — accept immediately
      this.store.dispatch(WorkspaceActions.acceptInvitation({ token }));
    } else {
      // Not logged in — redirect to login with invite token
      this.router.navigate(['/login'], { queryParams: { invite: token } });
    }
  }
}
