import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Player {
  name: string;
  pa: number;
  ab: number;
  h: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  r: number;
  k: number;
  kpct: number;
  sb: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

type SortKey = keyof Player;
type SortDir = 'asc' | 'desc';

// Raw row shape from the CSV
interface AppearanceRow {
  Name:       string;
  Appearance: string;
  League:     string;
  RBI:        number;
  Run:        number;
  SB:         number;
  RISP:       boolean;
}

// ── Stat calculation ──────────────────────────────────────────────────────────

const COUNT_TOWARDS_AB = new Set(['1b', '2b', '3b', 'HR', 'K', 'ROE', 'RFC', 'GO', 'FO']);
const COUNT_AS_HIT     = new Set(['1b', '2b', '3b', 'HR']);
const COUNT_ON_BASE    = new Set(['1b', '2b', '3b', 'HR', 'BB', 'HBP']);

function calculateStats(rows: AppearanceRow[]): Player[] {
  const byPlayer = new Map<string, AppearanceRow[]>();
  for (const row of rows) {
    const existing = byPlayer.get(row.Name) ?? [];
    existing.push(row);
    byPlayer.set(row.Name, existing);
  }

  const players: Player[] = [];

  for (const [name, appearances] of byPlayer) {
    const pa      = appearances.length;
    const ab      = appearances.filter(r => COUNT_TOWARDS_AB.has(r.Appearance)).length;
    const h       = appearances.filter(r => COUNT_AS_HIT.has(r.Appearance)).length;
    const onBase  = appearances.filter(r => COUNT_ON_BASE.has(r.Appearance)).length;
    const singles = appearances.filter(r => r.Appearance === '1b').length;
    const doubles = appearances.filter(r => r.Appearance === '2b').length;
    const triples = appearances.filter(r => r.Appearance === '3b').length;
    const hr      = appearances.filter(r => r.Appearance === 'HR').length;
    const rbi     = appearances.reduce((s, r) => s + (Number(r.RBI) || 0), 0);
    const r       = appearances.reduce((s, r) => s + (Number(r.Run) || 0), 0);
    const k       = appearances.filter(r => r.Appearance === 'K').length;
    const sb      = appearances.reduce((s, r) => s + (Number(r.SB)  || 0), 0);

    if (ab < 2) continue;

    const totalBases = singles + doubles * 2 + triples * 3 + hr * 4;
    const avg   = ab > 0 ? round3(h / ab)         : 0;
    const obp   = pa > 0 ? round3(onBase / pa)     : 0;
    const slg   = ab > 0 ? round3(totalBases / ab) : 0;
    const ops   = round3(obp + slg);
    const kpct  = pa > 0 ? round3(k / pa)          : 0;

    players.push({ name, pa, ab, h, singles, doubles, triples, hr, rbi, r, k, kpct, sb, avg, obp, slg, ops });
  }

  return players;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsv(text: string): AppearanceRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim());
  const rows: AppearanceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (values[idx] ?? '').trim(); });

    rows.push({
      Name:       obj['Name'],
      Appearance: obj['Appearance'],
      League:     obj['League'] ?? '',
      RBI:        Number(obj['RBI']) || 0,
      Run:        Number(obj['Run']) || 0,
      SB:         Number(obj['SB'])  || 0,
      RISP:       obj['RISP']?.toLowerCase() === 'true',
    });
  }

  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-stats-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-table.html',
  styleUrl: './stats-table.css',
})
export class StatsTable implements OnInit {

  private http = inject(HttpClient);

  // ── Raw data ───────────────────────────────────────────────────────────────

  private rawRows = signal<AppearanceRow[]>([]);

  // ── State ──────────────────────────────────────────────────────────────────

  readonly loading    = signal(true);
  readonly error      = signal<string | null>(null);

  searchTerm         = signal('');
  minPA              = signal(0);
  sortKey            = signal<SortKey>('ops');
  sortDir            = signal<SortDir>('desc');
  rispOnly           = signal(false);
  selectedLeagues    = signal<Set<string>>(new Set());

  // ── Derived ────────────────────────────────────────────────────────────────

  readonly allLeagues = computed(() => {
    const leagues = new Set(this.rawRows().map(r => r.League).filter(Boolean));
    return [...leagues].sort();
  });

  private filteredRows = computed(() => {
    let rows = this.rawRows();
    if (this.rispOnly()) {
      rows = rows.filter(r => r.RISP);
    }
    const sel = this.selectedLeagues();
    if (sel.size > 0) {
      rows = rows.filter(r => sel.has(r.League));
    }
    return rows;
  });

  private allPlayers = computed(() => calculateStats(this.filteredRows()));

  // ── Columns ────────────────────────────────────────────────────────────────

  readonly columns = [
    { key: 'name'    as const, label: 'Player', title: 'Player name',              isRate: false },
    { key: 'pa'      as const, label: 'PA',     title: 'Plate Appearances',         isRate: false },
    { key: 'ab'      as const, label: 'AB',     title: 'At Bats',                   isRate: false },
    { key: 'h'       as const, label: 'H',      title: 'Hits',                      isRate: false },
    { key: 'singles' as const, label: '1B',     title: 'Singles',                   isRate: false },
    { key: 'doubles' as const, label: '2B',     title: 'Doubles',                   isRate: false },
    { key: 'triples' as const, label: '3B',     title: 'Triples',                   isRate: false },
    { key: 'hr'      as const, label: 'HR',     title: 'Home Runs',                 isRate: false },
    { key: 'rbi'     as const, label: 'RBI',    title: 'Runs Batted In',            isRate: false },
    { key: 'r'       as const, label: 'R',      title: 'Runs Scored',               isRate: false },
    { key: 'k'       as const, label: 'K',      title: 'Strikeouts',                isRate: false },
    { key: 'kpct'    as const, label: 'K%',     title: 'Strikeout Rate (K/PA)',     isRate: true  },
    { key: 'sb'      as const, label: 'SB',     title: 'Stolen Bases',              isRate: false },
    { key: 'avg'     as const, label: 'AVG',    title: 'Batting Average',           isRate: true  },
    { key: 'obp'     as const, label: 'OBP',    title: 'On-Base Percentage',        isRate: true  },
    { key: 'slg'     as const, label: 'SLG',    title: 'Slugging Percentage',       isRate: true  },
    { key: 'ops'     as const, label: 'OPS',    title: 'On-Base Plus Slugging',     isRate: true  },
  ] as const;

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly filteredPlayers = computed(() => {
    const term  = this.searchTerm().toLowerCase();
    const minpa = this.minPA();
    const key   = this.sortKey();
    const dir   = this.sortDir();

    return [...this.allPlayers()]
      .filter(p => p.name.toLowerCase().includes(term) && p.pa >= minpa)
      .sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        const cmp = typeof av === 'string'
          ? (av as string).localeCompare(bv as string)
          : (av as number) - (bv as number);
        return dir === 'asc' ? cmp : -cmp;
      });
  });

  readonly teamAvg = computed(() => {
    const ps = this.allPlayers().filter(p => p.avg > 0);
    return ps.length ? (ps.reduce((s, p) => s + p.avg, 0) / ps.length).toFixed(3) : '---';
  });

  readonly teamOPS = computed(() => {
    const ps = this.allPlayers();
    return ps.length ? (ps.reduce((s, p) => s + p.ops, 0) / ps.length).toFixed(3) : '---';
  });

  readonly totalHR = computed(() => this.allPlayers().reduce((s, p) => s + p.hr, 0));
  readonly totalSB = computed(() => this.allPlayers().reduce((s, p) => s + p.sb, 0));

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.http.get('appearances.csv', { responseType: 'text' }).subscribe({
      next: (text) => {
        this.rawRows.set(parseCsv(text));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Could not load appearances.csv — make sure it is in the /public folder.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  onSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  toggleRisp(): void {
    this.rispOnly.set(!this.rispOnly());
  }

  toggleLeague(league: string): void {
    const current = new Set(this.selectedLeagues());
    if (current.has(league)) {
      current.delete(league);
    } else {
      current.add(league);
    }
    this.selectedLeagues.set(current);
  }

  isLeagueSelected(league: string): boolean {
    return this.selectedLeagues().has(league);
  }

  clearLeagues(): void {
    this.selectedLeagues.set(new Set());
  }

  formatValue(player: Player, key: SortKey): string {
    const val = player[key];
    if (typeof val === 'number') {
      return ['avg', 'obp', 'slg', 'ops', 'kpct'].includes(key)
        ? val.toFixed(3)
        : val.toString();
    }
    return val as string;
  }

  statColor(key: SortKey, value: number): string {
    const thresholds: Partial<Record<SortKey, { great: number; good: number; invert?: boolean }>> = {
      avg:  { great: 0.400, good: 0.280 },
      obp:  { great: 0.600, good: 0.350 },
      slg:  { great: 0.700, good: 0.450 },
      ops:  { great: 1.000, good: 0.700 },
      kpct: { great: 0.100, good: 0.200, invert: true }, // lower is better
    };
    const t = thresholds[key];
    if (!t) return '';
    if (t.invert) {
      return value <= t.great ? 'elite' : value <= t.good ? 'average' : 'below';
    }
    return value >= t.great ? 'elite' : value >= t.good ? 'average' : 'below';
  }
}