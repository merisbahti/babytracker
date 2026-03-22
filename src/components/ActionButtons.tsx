import type { Component } from "solid-js";

interface ActionButtonsProps {
  napping: boolean;
  napStart: number;
  lastNapEnd: number;
  lastNapDuration: number;
  lastFeed: number;
  lastFormula: number;
  lastVitaminD: number;
  tick: number;
  onFeed: () => void;
  onFormula: () => void;
  onVitaminD: () => void;
  onNap: () => void;
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

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
}

const ActionButtons: Component<ActionButtonsProps> = (props) => {
  void props.tick;
  const feedAgo = () => { void props.tick; return timeAgo(props.lastFeed); };
  const formulaAgo = () => { void props.tick; return timeAgo(props.lastFormula); };
  const vitaminDAgo = () => { void props.tick; return timeAgo(props.lastVitaminD); };
  const napDur = () => {
    void props.tick;
    return props.napping && props.napStart ? Date.now() - props.napStart : 0;
  };
  const napSub = () => {
    if (props.napping) return formatDuration(napDur());
    if (props.lastNapEnd) return `Senaste: ${formatDuration(props.lastNapDuration)} · ${timeAgo(props.lastNapEnd)}`;
    return "";
  };

  return (
    <>
      <button
        class="nap-btn"
        style={{
          background: props.napping ? "#7a2020" : "#2a6a2a",
          "box-shadow": props.napping ? "0 4px 0 #4a1010" : "0 4px 0 #1a4a1a",
        }}
        onClick={props.onNap}
      >
        <div>{props.napping ? "⏹ Avsluta nap" : "▶ Starta nap"}</div>
        <div class="nap-btn-sub">{napSub()}</div>
      </button>

      <div class="grid2">
        <button
          class="big-btn"
          style={{ background: "#1a4a6a", "box-shadow": "0 4px 0 #0a2a4a" }}
          onClick={props.onFeed}
        >
          <span class="big-btn-emoji">🍽️</span>
          <span class="big-btn-label">Matad</span>
          <span class="big-btn-sub">{feedAgo()}</span>
        </button>
        <button
          class="big-btn"
          style={{ background: "#6a3a1a", "box-shadow": "0 4px 0 #3a1a00" }}
          onClick={props.onFormula}
        >
          <span class="big-btn-emoji">🍼</span>
          <span class="big-btn-label">Ersättning</span>
          <span class="big-btn-sub">{formulaAgo()}</span>
        </button>
        <button
          class="big-btn"
          style={{
            background: "#5a4a00",
            "box-shadow": "0 4px 0 #2a2200",
            "grid-column": "1 / -1",
          }}
          onClick={props.onVitaminD}
        >
          <span class="big-btn-emoji">☀️</span>
          <span class="big-btn-label">D-vitamin</span>
          <span class="big-btn-sub">{vitaminDAgo()}</span>
        </button>
      </div>
    </>
  );
};

export default ActionButtons;
