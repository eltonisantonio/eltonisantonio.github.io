import { Injectable, signal } from '@angular/core';

type SyncStatus = 'idle' | 'saving' | 'loading' | 'ok' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fb = (): any => (window as any)['firebase'];

const docRef = () =>
  fb().firestore().collection('sistema').doc('dados');

const accessRef = () =>
  fb().firestore().collection('sistema').doc('acessos');

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly status   = signal<SyncStatus>('idle');
  readonly lastSync = signal<string | null>(null);

  async save(data: unknown): Promise<void> {
    this.status.set('saving');
    try {
      await docRef().set({
        dados:      JSON.stringify(data),
        atualizado: new Date().toISOString(),
      });
      this.status.set('ok');
      this.lastSync.set(new Date().toLocaleTimeString('pt-BR'));
    } catch {
      this.status.set('error');
    }
  }

  async load(): Promise<unknown | null> {
    this.status.set('loading');
    try {
      const doc = await docRef().get();
      if (doc.exists) {
        const parsed = JSON.parse(doc.data()['dados']);
        this.status.set('ok');
        this.lastSync.set(new Date().toLocaleTimeString('pt-BR'));
        return parsed;
      }
      this.status.set('idle');
      return null;
    } catch {
      this.status.set('error');
      return null;
    }
  }

  logAccess(acao: string, detalhe = ''): void {
    try {
      const ref = accessRef();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref.get().then((doc: any) => {
        const logs: unknown[] = doc.exists ? (doc.data()['logs'] ?? []) : [];
        logs.unshift({
          data:   new Date().toISOString(),
          acao,
          detalhe,
          agente: navigator.userAgent.substring(0, 50),
        });
        ref.set({ logs: logs.slice(0, 200) });
      });
    } catch { /* silent — fire-and-forget */ }
  }
}
