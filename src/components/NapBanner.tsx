import type { Component } from "solid-js";

interface NapBannerProps {
  napping: boolean;
  napStart: number;
  lastNapEnd: number;
  lastNapDuration: number;
  tick: number; // reactive tick to force re-render every second
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
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

const NapBanner: Component<NapBannerProps> = (props) => {
  const napDur = () => {
    // access tick to force reactivity
    void props.tick;
    return props.napping && props.napStart ? Date.now() - props.napStart : 0;
  };

  return (
    <div
      class="nap-banner"
      style={{
        background: props.napping ? "#d4edda" : "#fff3cd",
        border: `2px solid ${props.napping ? "#8bc34a" : "#e8c840"}`,
      }}
    >
      <div class="nap-emoji">{props.napping ? "😴" : "👀"}</div>
      <div class="nap-label">{props.napping ? "Sover" : "Vaken"}</div>
      <div class="nap-timer">
        {props.napping ? formatDuration(napDur()) : ""}
      </div>
      <div class="nap-sub">
        {!props.napping && props.lastNapEnd
          ? `Senaste nap: ${formatDuration(props.lastNapDuration)} · ${timeAgo(props.lastNapEnd)}`
          : ""}
      </div>
    </div>
  );
};

export default NapBanner;
