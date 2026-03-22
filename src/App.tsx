import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { AppState, LogEntry } from "./types";
import { saveState, subscribeToRoom } from "./firebase";
import ActionButtons from "./components/ActionButtons";
import Summary from "./components/Summary";
import LogTab from "./components/LogTab";
import TimeModal from "./components/TimeModal";
import "./index.css";

const ROOM = new URLSearchParams(window.location.search).get("room");

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
}

function deriveNapState(logs: LogEntry[]): { napping: boolean; napStart: number } {
  for (const log of logs) {
    if (log.label === "😴 Nap startad") return { napping: true, napStart: log.ts };
    if (log.label.startsWith("💤 Nap avslutad")) return { napping: false, napStart: 0 };
  }
  return { napping: false, napStart: 0 };
}

function syncSummaryFromLogs(state: AppState): Partial<AppState> {
  const logs = state.logs || [];
  const latest = (label: string) => {
    const entry = logs.find((l) => l.label === label);
    return entry ? entry.ts : 0;
  };
  const lastFeed = latest("🍽️ Matad");
  const lastFormula = latest("🍼 Ersättning");
  const lastVitaminD = latest("☀️ D-vitamin");

  const lastEnd = logs.find((l) => l.label.startsWith("💤 Nap avslutad"));
  let lastNapEnd = state.lastNapEnd;
  let lastNapDuration = state.lastNapDuration;
  if (lastEnd) {
    lastNapEnd = lastEnd.ts;
    const lastStart = logs.find(
      (l) => l.label === "😴 Nap startad" && l.ts <= lastEnd.ts
    );
    lastNapDuration = lastStart ? lastEnd.ts - lastStart.ts : state.lastNapDuration;
  }

  return { lastFeed, lastFormula, lastVitaminD, lastNapEnd, lastNapDuration };
}

function addLog(logs: LogEntry[], label: string): LogEntry[] {
  return [{ label, ts: Date.now() }, ...logs].slice(0, 50);
}

const emptyState: AppState = {
  lastFeed: 0,
  lastFormula: 0,
  lastVitaminD: 0,
  lastNapEnd: 0,
  lastNapDuration: 0,
  logs: [],
};

function App() {
  if (!ROOM) {
    return (
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          height: "100vh",
          "font-family": "Georgia,serif",
          color: "#888",
          "font-size": "16px",
          padding: "20px",
          "text-align": "center",
        }}
      >
        Ange ?room= i URL:en
      </div>
    );
  }

  const [state, setState] = createStore<AppState>({ ...emptyState });
  const [tab, setTab] = createSignal<"main" | "log">("main");
  const [tick, setTick] = createSignal(0);
  const [modalOpen, setModalOpen] = createSignal(false);
  const [editIndex, setEditIndex] = createSignal(-1);
  const [editTs, setEditTs] = createSignal(0);

  // 1-second ticker
  createEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    onCleanup(() => clearInterval(id));
  });

  // Firebase subscription
  createEffect(() => {
    const unsub = subscribeToRoom(
      ROOM,
      (data) => {
        setState(produce((s) => {
          const synced = syncSummaryFromLogs(data);
          Object.assign(s, data, synced);
        }));
      },
      () => {}
    );
    onCleanup(unsub);
  });

  const derived = () => {
    const summary = syncSummaryFromLogs(state);
    const napInfo = deriveNapState(state.logs);
    return { ...summary, ...napInfo };
  };

  const handleFeed = () => {
    const newLogs = addLog(state.logs, "🍽️ Matad");
    const newState = { ...state, logs: newLogs };
    const synced = syncSummaryFromLogs(newState);
    setState(produce((s) => { s.logs = newLogs; Object.assign(s, synced); }));
    saveState(ROOM, { ...state });
  };

  const handleFormula = () => {
    const newLogs = addLog(state.logs, "🍼 Ersättning");
    const newState = { ...state, logs: newLogs };
    const synced = syncSummaryFromLogs(newState);
    setState(produce((s) => { s.logs = newLogs; Object.assign(s, synced); }));
    saveState(ROOM, { ...state });
  };

  const handleVitaminD = () => {
    const newLogs = addLog(state.logs, "☀️ D-vitamin");
    const newState = { ...state, logs: newLogs };
    const synced = syncSummaryFromLogs(newState);
    setState(produce((s) => { s.logs = newLogs; Object.assign(s, synced); }));
    saveState(ROOM, { ...state });
  };

  const handleNap = () => {
    const { napping, napStart } = deriveNapState(state.logs);
    let newLogs: LogEntry[];
    if (!napping) {
      newLogs = addLog(state.logs, "😴 Nap startad");
    } else {
      const dur = Date.now() - napStart;
      newLogs = addLog(state.logs, `💤 Nap avslutad (${formatDuration(dur)})`);
    }
    const newState = { ...state, logs: newLogs };
    const synced = syncSummaryFromLogs(newState);
    setState(produce((s) => { s.logs = newLogs; Object.assign(s, synced); }));
    saveState(ROOM, { ...state });
  };

  const handleEditEntry = (index: number) => {
    setEditIndex(index);
    setEditTs(state.logs[index].ts);
    setModalOpen(true);
  };

  const handleModalSave = (newTs: number) => {
    setState(
      produce((s) => {
        const entry = s.logs[editIndex()];
        if (!entry) return;
        const updatedEntry: LogEntry = { ...entry, ts: newTs };
        if (updatedEntry.label.startsWith("💤 Nap avslutad")) {
          const start = s.logs.find(
            (l) => l.label === "😴 Nap startad" && l.ts <= newTs
          );
          if (start) {
            updatedEntry.label = `💤 Nap avslutad (${formatDuration(newTs - start.ts)})`;
          }
        }
        s.logs[editIndex()] = updatedEntry;
        const synced = syncSummaryFromLogs(s as AppState);
        Object.assign(s, synced);
      })
    );
    saveState(ROOM, { ...state });
    setModalOpen(false);
  };

  const handleModalDelete = () => {
    setState(
      produce((s) => {
        s.logs = s.logs.filter((_, i) => i !== editIndex());
        const synced = syncSummaryFromLogs(s as AppState);
        Object.assign(s, synced);
      })
    );
    saveState(ROOM, { ...state });
    setModalOpen(false);
  };

  return (
    <>
      <div class="tabs">
        <button class={`tab-btn${tab() === "main" ? " tab-btn--active" : ""}`} onClick={() => setTab("main")}>
          Hem
        </button>
        <button class={`tab-btn${tab() === "log" ? " tab-btn--active" : ""}`} onClick={() => setTab("log")}>
          Logg
        </button>
      </div>

      <Show when={tab() === "main"}>
        <div class="main-pad">
          <ActionButtons
            napping={derived().napping}
            napStart={derived().napStart}
            lastNapEnd={derived().lastNapEnd ?? 0}
            lastNapDuration={derived().lastNapDuration ?? 0}
            lastFeed={derived().lastFeed ?? 0}
            lastFormula={derived().lastFormula ?? 0}
            lastVitaminD={derived().lastVitaminD ?? 0}
            tick={tick()}
            onFeed={handleFeed}
            onFormula={handleFormula}
            onVitaminD={handleVitaminD}
            onNap={handleNap}
          />
          <Summary
            lastFeed={derived().lastFeed ?? 0}
            lastFormula={derived().lastFormula ?? 0}
            lastVitaminD={derived().lastVitaminD ?? 0}
            lastNapEnd={derived().lastNapEnd ?? 0}
            lastNapDuration={derived().lastNapDuration ?? 0}
            tick={tick()}
          />
        </div>
      </Show>

      <Show when={tab() === "log"}>
        <LogTab
          logs={state.logs}
          tick={tick()}
          onEditEntry={handleEditEntry}
        />
      </Show>

      <TimeModal
        open={modalOpen()}
        editTs={editTs()}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </>
  );
}

export default App;
