# CLAUDE.md

## Project Overview

Variable compensation system for **Raguife**. Managers submit indicator results per sector/period, and the system automatically calculates the variable pay achievement percentage for each sector.

The **working PoC** is at [`./poc/index.html`](./poc/index.html) — a single HTML/JS/CSS file backed by Firebase Firestore. It serves as the **living specification** for behavior, business rules, and visual design. Always consult the PoC when you need to understand the expected behavior of a feature.

The `./src` project is the **ground-up rebuild** in Angular — cleaner, testable, and modern.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, signals) |
| Language | TypeScript 5.9 |
| BaaS | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Styling | Custom SCSS (replicate the PoC's visual design) |
| Icons | Lucide (`lucide-angular` — official Angular package) |
| Formatting | Prettier (`.prettierrc` at root) |
| Testing | Vitest |

**Firebase is not used in the Angular project** — the PoC uses Firebase, but the rebuild uses Supabase.

---

## Architecture Goals

This project is a **modern Angular study object**. Always prioritize the latest Angular features:

- **Standalone components** — no NgModules
- **Signals** (`signal`, `computed`, `effect`) — for reactive state instead of BehaviorSubject
- **`inject()`** instead of constructor injection
- **`@if` / `@for` / `@switch`** (Angular 17+ control flow blocks) instead of `*ngIf` / `*ngFor`
- **`input()` / `output()`** (signal-based) instead of `@Input()` / `@Output()` decorators
- **Lazy loading** routes with `loadComponent`
- **Functional guards** for access control
- **Functional interceptors** for `HttpClient` (not class-based)

---

## Business Domain

### Modules and Periodicities

The system has 5 modules, each with its own periodicity:

| Module | UI Label | Indicator periodicity |
|--------|----------|-----------------------|
| `adm` | Administrativo | Monthly + optional quarterly/semi-annual/annual |
| `industria` | Operação | Monthly + optional quarterly/semi-annual/annual + 5S audits |
| `trimestral` | Trimestral | Quarterly indicators only |
| `semestral` | Semestral | Semi-annual indicators only |
| `anual` | Anual | Annual indicators only |

The `trimestral`, `semestral`, and `anual` modules group indicators from **both** base modules (ADM and Operação) by periodicity.

### Sectors

Each sector belongs to a base module (`adm` or `industria`). Examples from the PoC:
- ADM: ALMOXARIFADO, AMBULATÓRIO, BALANÇA, COMERCIAL, etc.
- Operação: ABASTECIMENTO, CONTROLE DE QUALIDADE, E.T.E., ENSAQUE, etc.

Some ADM sectors have a `neves` flag (Neves — a sub-company within the group).

### Indicators

```typescript
interface IIndicator {
  id: string;
  name: string;
  sector: string;
  module: 'adm' | 'industria';
  periodicity: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  direction: 'higher' | 'lower';  // whether higher or lower values are better
  weight: number;       // 0–1, weights per sector must sum to 1
  target100: number;    // 100% achievement threshold
  target95?: number;
  target90?: number;
  target85?: number;
  closingMonth?: number; // closing month for quarterly/semi-annual/annual indicators
  shift?: string;       // differentiates by work shift (Operação only)
  role?: string;        // differentiates by job role
}
```

### Calculation Logic

**Per-indicator achievement:**
```
result >= target100 → achievement = weight × 1.00
result >= target95  → achievement = weight × 0.95
result >= target90  → achievement = weight × 0.90
result >= target85  → achievement = weight × 0.85
otherwise           → achievement = 0
```
Comparison uses `>=` for `direction: 'higher'` and `<=` for `direction: 'lower'`.

**Sector gross score** = sum of achievements for all active indicators in the period.

**Penalties:**
- **5S audit** (Operação only): if the sector's average audit score for the period < 7.5 → **-5%**
- **SST incident** (non-fatal): if the sector had an incident in the period → **-5%**
- **Fatal accident**: **-100%** across ALL sectors — variable pay is zeroed for the entire period

**Sector final score** = gross score + penalties (minimum 0)

### Period

The system operates on a single active period at a time (`month` + `year`). Only the master user can change the period. Quarterly/semi-annual/annual indicators only count in their configured closing month.

---

## Access Control

Two user roles:

| Role | Permissions |
|------|-------------|
| `master` | Full access: configure period, manage sectors, indicators, and users, submit results for any module/sector |
| `manager` | Restricted access: submit results only for the modules and sectors they are assigned to |

Supabase Auth + RLS must enforce these permissions at the database level (managers must not be able to read or write data for sectors they are not assigned to).

---

## Pages / Features

Based on the PoC, the system has the following screens:

1. **Login** — authentication (master via password, or manager by selecting name + password)
2. **Result Entry** — form for entering indicator values per sector
3. **Managers Panel** — consolidated view of scores by sector across all modules
4. **Indicator Management** — CRUD for indicators per module/sector
5. **Sector Management** — manage sectors per module
6. **History** — results evolution by module and sector over periods
7. **SST Incidents** — record safety incidents per sector
8. **5S Audits** — record audits per sector (ADM and Operação)
9. **Users** — CRUD for managers (master only)

---

## Suggested Folder Structure

```
src/app/
  core/
    auth/           # guard, interceptor, auth service
    supabase/       # Supabase client, generated types
    layouts/        # shell/layout components (sidebar, topbar, etc.)
    interfaces/     # IName interfaces for API response shapes
    types/          # internal app types (unions, enums, utility types)
  features/
    result-entry/   # result submission
    managers/       # managers panel
    history/        # results history
    admin/          # sector, indicator and user management
    incidents/      # SST and 5S
  shared/
    components/     # reusable components (tables, cards, badges, etc.)
    pipes/          # pipes (e.g. percentage formatting)
```

---

## Commands

```bash
npm start          # ng serve — starts the dev server
npm run build      # ng build — production build
npm test           # vitest — runs tests
```

---

## Code Conventions

- **Language**: all code (variables, functions, classes, interfaces, files) must be written in **English**
- **UI language**: Brazilian Portuguese (pt-BR) for all user-facing text
- **Interface naming**: use the `IName` prefix — e.g., `IUser`, `IIndicator`, `ISector`, `IPeriod`
- **Interfaces vs types**: `interface IName` for typing API response data (lives in `core/interfaces/`); `type` for internal application types such as unions, enums, and utility types (lives in `core/types/`)
- **No NgModules**: standalone components only
- **No obvious comments**: only comment when the *why* is non-obvious
- **Icons**: use `lucide-angular` for all icons — no other icon library
- **Prettier**: every file must pass Prettier before committing

---

## PoC Reference

The PoC at `./poc/index.html` contains the full business logic implemented and working. Key functions to consult:

- `calcAtingInd(ind, resultado)` — calculates a single indicator's achievement
- `calcBrutoSetor(setor, turno, funcao, modulo)` — sector gross score
- `calcPen5S(setor)` — 5S audit penalty
- `calcPenSST(setor)` — SST incident penalty (includes fatal accident logic)
- `indicadorContaMes(ind)` — checks whether an indicator counts in the current period
- `defaultDB()` — default data structure with initial sectors and indicators
- `defaultIndicadores()` — full list of Raguife's default indicators
