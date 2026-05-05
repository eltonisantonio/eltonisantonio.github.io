import { Component, inject } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { ToastService } from '../../shared/services/toast.service';
import { APP_ROUTES } from '../../core/configs/app-routes';

@Component({
  standalone: true,
  imports: [],
  templateUrl: './export.component.html',
})
export class ExportComponent {
  private readonly db    = inject(DbService);
  private readonly toast = inject(ToastService);

  protected readonly firebase = inject(FirebaseService);
  protected readonly title    = APP_ROUTES.export.label;

  protected exportJson(): void {
    const period = this.db.currentPeriod();
    const blob   = new Blob([JSON.stringify(this.db.db(), null, 2)], { type: 'application/json' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = `variavel_dados_${period}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.firebase.logAccess('Download JSON', `variavel_dados_${period}.json`);
    this.toast.show('Arquivo exportado!');
  }

  protected importJson(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (!raw || typeof raw !== 'object') throw new Error();

        if (raw['version'] !== 2) {
          alert('Arquivo incompatível. Use um JSON exportado por esta versão do sistema.');
          return;
        }

        if (!confirm(`Importar "${file.name}"? Os dados atuais serão substituídos.`)) return;
        this.db.update(() => raw);
        this.toast.show('Dados importados com sucesso!');
      } catch {
        this.toast.show('Erro ao ler o arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected reset(): void {
    if (!confirm(
      'Isso apagará TODOS os dados (resultados, 5S, SST, configurações) e restaurará os indicadores padrão. Esta ação não pode ser desfeita. Confirmar?',
    )) return;
    this.db.reset();
    this.toast.show('Sistema restaurado para o padrão.');
  }

  protected async syncFromCloud(): Promise<void> {
    const ok = await this.db.syncFromCloud();
    this.toast.show(ok ? 'Dados sincronizados da nuvem!' : 'Nenhum dado encontrado na nuvem.', ok ? 'success' : 'error');
  }
}
