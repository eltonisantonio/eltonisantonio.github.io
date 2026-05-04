import { Component, inject } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ROUTE_LABELS } from '../../core/routes.map';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [],
  templateUrl: './export.component.html',
})
export class ExportComponent {
  private readonly db = inject(DbService);

  protected readonly title = ROUTE_LABELS.export;

  protected exportJson(): void {
    const period = this.db.currentPeriod();
    const blob   = new Blob([JSON.stringify(this.db.db(), null, 2)], { type: 'application/json' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = `variavel_dados_${period}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
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
      } catch {
        alert('Erro ao ler o arquivo. Verifique se é um JSON válido exportado por este sistema.');
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
  }
}
