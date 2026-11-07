/* 今日AI速报 Service Worker：页面和数据优先走网络（保证最新），图片/脚本优先用缓存（秒开）；断网时用缓存兜底 */
var V = 'aitoday-2611071629';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function put(req, res) { if (res && res.ok && res.type === 'basic') { var c = res.clone(); caches.open(V).then(function (ca) { ca.put(req, c); }); } return res; }
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  var fresh = r.mode === 'navigate' || /\.html$|\/$/.test(u.pathname) || u.pathname.indexOf('/data/') === 0 || /\.webmanifest$/.test(u.pathname);
  if (fresh) {
    e.respondWith(fetch(r).then(function (res) { return put(r, res); }).catch(function () {
      return caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(function (m) { return m || caches.match('index.html', { ignoreSearch: true }); });
    }));
  } else {
    e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(function (res) { return put(r, res); }); }));
  }
});
