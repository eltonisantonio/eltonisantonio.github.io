import { Injectable, signal, computed, inject } from '@angular/core';
import type { Db, Indicator } from '../models';
import type { Direction, Format, Periodicity } from '../models';
import type { SstIncident } from '../models';
import { defaultDb } from '../data/default-db.data';
import { FirebaseService } from './firebase.service';

const STORAGE_KEY = 'sistema_variavel_v2';
const LEGACY_KEY  = 'variavel_unificado_v1';

@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly firebase = inject(FirebaseService);
  private readonly _db = signal<Db>(this.loadInitialState());

  readonly db           = this._db.asReadonly();
  readonly indicators   = computed(() => this._db().indicators);
  readonly sectors      = computed(() => this._db().sectors);
  readonly shifts       = computed(() => this._db().shifts);
  readonly currentPeriod = computed(() => this._db().currentPeriod);
  readonly results      = computed(() => this._db().results);
  readonly audits5S     = computed(() => this._db().audits5S);
  readonly sstIncidents = computed(() => this._db().sstIncidents);
  readonly sstFatalActive = computed(() => this._db().sstFatalActive);
  readonly billing      = computed(() => this._db().billing);
  readonly passwords    = computed(() => this._db().passwords);

  update(updater: (current: Db) => Db): void {
    const next = updater(this._db());
    this._db.set(next);
    this.persist(next);
  }

  reset(): void {
    const fresh = defaultDb();
    this._db.set(fresh);
    this.persist(fresh);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private loadInitialState(): Db {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      try {
        return JSON.parse(v2) as Db;
      } catch {
        // corrupted — fall through
      }
    }

    const v1 = localStorage.getItem(LEGACY_KEY);
    if (v1) {
      try {
        const migrated = migrateFromLegacy(JSON.parse(v1));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      } catch {
        // corrupted legacy — fall through
      }
    }

    return defaultDb();
  }

  async syncFromCloud(): Promise<boolean> {
    const remote = await this.firebase.load();
    if (!remote || typeof remote !== 'object') return false;
    if ((remote as Db)['version'] !== 2) return false;
    const db = remote as Db;
    this._db.set(db);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    this.firebase.logAccess('Sincronização', 'Dados carregados da nuvem');
    return true;
  }

  private persist(db: Db): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    this.firebase.save(db);
    this.firebase.logAccess('Salvamento');
  }
}

// ── Migration from v1 (Portuguese field names) ────────────────────────────────

function migrateFromLegacy(raw: Record<string, unknown>): Db {
  const base = defaultDb();

  // Period: legacy stored as { mes: number, ano: number }
  const periodo = raw['periodo'] as { mes: number; ano: number } | undefined;
  if (periodo) {
    const month = String(periodo.mes).padStart(2, '0');
    base.currentPeriod = `${periodo.ano}-${month}`;
  }

  if (typeof raw['acidente_fatal'] === 'boolean') {
    base.sstFatalActive = raw['acidente_fatal'];
  }

  const setores = raw['setores'] as string[] | undefined;
  if (setores?.length) base.sectors = setores;

  const turnos = raw['turnos'] as string[] | undefined;
  if (turnos?.length) base.shifts = turnos;

  const indicadores = raw['indicadores'] as Record<string, unknown>[] | undefined;
  if (indicadores?.length) {
    base.indicators = indicadores.map(migrateIndicator);
  }

  // Results keys stay the same — composite strings built from sector/shift names
  const resultados = raw['resultados'] as Db['results'] | undefined;
  if (resultados) base.results = resultados;

  // 5S audits: field renames within each entry
  const s5 = raw['s5'] as Record<string, Record<string, unknown>[]> | undefined;
  if (s5) {
    base.audits5S = Object.fromEntries(
      Object.entries(s5).map(([key, entries]) => [
        key,
        entries.map(e => ({ score: e['nota'] as number, date: e['data'] as string, auditor: e['auditor'] as string })),
      ]),
    );
  }

  const incidents = raw['sst_incidentes'] as Record<string, unknown>[] | undefined;
  if (incidents?.length) {
    base.sstIncidents = incidents.map(
      (inc): SstIncident => ({
        id:          inc['id'] as number,
        sector:      inc['setor'] as string,
        date:        inc['data'] as string,
        type:        inc['tipo'] as SstIncident['type'],
        description: inc['desc'] as string,
        period:      inc['periodo'] as string,
      }),
    );
  }

  const faturamento = raw['faturamento'] as Record<string, number> | undefined;
  if (faturamento) base.billing = faturamento;

  const senhas = raw['senhas'] as { planejamento?: string; qualidade?: string; sst?: string } | undefined;
  if (senhas) {
    base.passwords = {
      planning: senhas.planejamento ?? '',
      quality:  senhas.qualidade   ?? '',
      sst:      senhas.sst         ?? '',
    };
  }

  return base;
}

const DIRECTION_MAP: Record<string, Direction> = { maior: 'higher', menor: 'lower' };
const FORMAT_MAP:    Record<string, Format>    = { decimal: 'decimal', inteiro: 'integer', absoluto: 'absolute' };
const PERIOD_MAP:    Record<string, Periodicity> = {
  mensal: 'monthly', trimestral: 'quarterly', semestral: 'semiannual', anual: 'annual',
};

function migrateIndicator(raw: Record<string, unknown>): Indicator {
  return {
    id:           raw['id']          as number,
    sector:       (raw['setor']      as string) ?? '',
    shift:        (raw['turno']      as string) ?? '',
    role:         (raw['funcao']     as string) ?? '',
    name:         (raw['nome']       as string) ?? '',
    direction:    DIRECTION_MAP[raw['sentido'] as string] ?? 'higher',
    format:       FORMAT_MAP[raw['formato']    as string] ?? 'decimal',
    periodicity:  PERIOD_MAP[raw['periodicidade'] as string] ?? 'monthly',
    closingMonth: (raw['fechamento'] as number | null) ?? null,
    weight:       (raw['peso']       as number) ?? 0,
    target85:     (raw['m85']        as number | null) ?? null,
    target90:     (raw['m90']        as number | null) ?? null,
    target95:     (raw['m95']        as number | null) ?? null,
    target100:    (raw['m100']       as number | null) ?? null,
  };
}
