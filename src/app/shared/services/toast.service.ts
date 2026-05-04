import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id:   number;
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _messages = signal<ToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  show(text: string, type: 'success' | 'error' = 'success'): void {
    const id = Date.now();
    this._messages.update(msgs => [...msgs, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3200);
  }

  dismiss(id: number): void {
    this._messages.update(msgs => msgs.filter(m => m.id !== id));
  }
}
