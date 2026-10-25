/* 圖片排版產生器 service worker：離線可用＋接收 Android「分享」進來的圖片 */
const VERSION = 'lg-v13';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'lg-share').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* 分享目標：把圖片暫存進快取，再導回 App 讓頁面讀取 */
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const form = await req.formData(), c = await caches.open('lg-share');
        let i = 0;
        for (const f of form.getAll('images')) {
          if (!(f instanceof File)) continue;
          await c.put(new Request(`./shared/${Date.now()}-${i++}/${encodeURIComponent(f.name || 'image')}`), new Response(f, { headers: { 'Content-Type': f.type || 'image/jpeg' } }));
        }
      } catch (err) { /* 讀不到就直接開 App */ }
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;

  /* 頁面：先抓網路（拿到最新版），離線時用快取 */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }

  /* 其他靜態檔：先用快取，背景更新 */
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
