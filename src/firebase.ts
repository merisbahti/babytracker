import type { AppState } from "./types";

const DB_URL =
  "https://general-d26af-default-rtdb.europe-west1.firebasedatabase.app";

export function getRef(room: string): string {
  return `${DB_URL}/tracker/${room}.json`;
}

export async function saveState(room: string, state: AppState): Promise<void> {
  await fetch(getRef(room), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}

export function subscribeToRoom(
  room: string,
  onData: (state: AppState) => void,
  onError: () => void
): () => void {
  const url = `${DB_URL}/tracker/${room}.json`;
  const es = new EventSource(url);
  es.addEventListener("put", (e: MessageEvent) => {
    const parsed = JSON.parse(e.data);
    if (parsed.data) {
      const data = parsed.data;
      onData({
        lastFeed: data.lastFeed || 0,
        lastFormula: data.lastFormula || 0,
        lastVitaminD: data.lastVitaminD || 0,
        lastNapEnd: data.lastNapEnd || 0,
        lastNapDuration: data.lastNapDuration || 0,
        logs: data.logs
          ? Array.isArray(data.logs)
            ? data.logs
            : Object.values(data.logs)
          : [],
      });
    }
  });
  es.onerror = onError;
  return () => es.close();
}
