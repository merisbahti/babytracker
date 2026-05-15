self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          '<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baby Tracker</title><style>body{margin:0;background:#111;color:#eee;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh}</style></head><body><p>Laddar…</p></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        )
      )
    );
  }
});
