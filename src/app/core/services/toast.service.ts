import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = Date.now();
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
