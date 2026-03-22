import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import type { LogEntry } from "../types";

interface LogTabProps {
  logs: LogEntry[];
  tick: number;
  onEditEntry: (index: number) => void;
}

function formatTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}t ${m}m` : `${h}t`;
}

const LogTab: Component<LogTabProps> = (props) => {
  return (
    <div class="log-pad">
      <div class="log-hint">Tryck på en rad för att ändra tid</div>
      <Show
        when={props.logs.length > 0}
        fallback={
          <div style={{ "text-align": "center", color: "#bbb", padding: "40px" }}>
            Ingen logg än
          </div>
        }
      >
        <For each={props.logs}>
          {(entry, i) => {
            // access tick to refresh timeAgo
            void props.tick;
            return (
              <div class="log-entry" onClick={() => props.onEditEntry(i())}>
                <span class="log-entry-label">{entry.label}</span>
                <span class="log-entry-time">
                  {formatTime(entry.ts)} · {timeAgo(entry.ts)}
                </span>
              </div>
            );
          }}
        </For>
      </Show>
    </div>
  );
};

export default LogTab;
