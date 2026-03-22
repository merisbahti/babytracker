import type { Component } from "solid-js";

interface SummaryProps {
  lastFeed: number;
  lastFormula: number;
  lastVitaminD: number;
  lastNapEnd: number;
  lastNapDuration: number;
  tick: number;
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

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
}

const Summary: Component<SummaryProps> = (props) => {
  const feedVal = () => {
    void props.tick;
    return props.lastFeed
      ? `${formatTime(props.lastFeed)} · ${timeAgo(props.lastFeed)}`
      : "—";
  };
  const formulaVal = () => {
    void props.tick;
    return props.lastFormula
      ? `${formatTime(props.lastFormula)} · ${timeAgo(props.lastFormula)}`
      : "—";
  };
  const vitaminDVal = () => {
    void props.tick;
    return props.lastVitaminD
      ? `${formatTime(props.lastVitaminD)} · ${timeAgo(props.lastVitaminD)}`
      : "—";
  };
  const napVal = () =>
    props.lastNapEnd
      ? `${formatTime(props.lastNapEnd)} · ${formatDuration(props.lastNapDuration)}`
      : "—";

  return (
    <div class="summary">
      <div class="summary-title">Senast</div>
      <div class="sum-row">
        <span>🍽️ Mat</span>
        <span>{feedVal()}</span>
      </div>
      <div class="sum-row">
        <span>🍼 Ersättning</span>
        <span>{formulaVal()}</span>
      </div>
      <div class="sum-row">
        <span>☀️ D-vitamin</span>
        <span>{vitaminDVal()}</span>
      </div>
      <div class="sum-row">
        <span>💤 Nap</span>
        <span>{napVal()}</span>
      </div>
    </div>
  );
};

export default Summary;
