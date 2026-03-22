export interface LogEntry {
  label: string;
  ts: number;
}

export interface AppState {
  lastFeed: number;
  lastFormula: number;
  lastVitaminD: number;
  lastNapEnd: number;
  lastNapDuration: number;
  logs: LogEntry[];
}
