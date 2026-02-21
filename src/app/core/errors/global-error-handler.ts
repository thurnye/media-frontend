import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { GLOBAL_CONSTANTS } from '../constants/globalConstants';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private zone       = inject(NgZone);
  private router     = inject(Router);
  private toastSvc   = inject(ToastService);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);

    // Run inside Angular zone so signal/signal updates are detected
    this.zone.run(() => {
      this.toastSvc.show(GLOBAL_CONSTANTS.TOAST.UNEXPECTED_ERROR, 'error');
      this.router.navigate(['/error']);
    });
  }
}
