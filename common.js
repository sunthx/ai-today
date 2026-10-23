/* 公共小工具 */
var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function md(date) { var p = date.split('-'); return +p[1] + '月' + (+p[2]) + '日'; }
function wk(date) { var p = date.split('-'); return WEEK[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()]; }
function short(date) { var p = date.split('-'); return +p[1] + '/' + (+p[2]); }
function qs(k) { var m = location.search.match(new RegExp('[?&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : ''; }
function setQs(o) {
  var p = new URLSearchParams(location.search);
  Object.keys(o).forEach(function (k) { o[k] ? p.set(k, o[k]) : p.delete(k); });
  var q = p.toString();
  history.replaceState(null, '', q ? ('?' + q) : (location.pathname || '/'));
}

/* 右侧时间线（桌面固定在右侧，手机变成右侧抽屉）
   nodes: [{date, on, subs:[{key,label,on}]}]；点击回调 onPick(date, key) */
function renderTimeline(nodes, onPick) {
  var html = '<div class="tl-title">往期</div><ol class="tline">' + nodes.map(function (n) {
    return '<li class="tn' + (n.on ? ' on' : '') + '"><button class="td" data-d="' + n.date + '"><i></i><b>' + short(n.date) + '</b><small>' + wk(n.date) + '</small></button>' +
      (n.subs && n.subs.length ? '<div class="ts">' + n.subs.map(function (s) {
        return '<button data-d="' + n.date + '" data-k="' + s.key + '"' + (s.on ? ' class="on"' : '') + (s.disabled ? ' disabled' : '') + '>' + s.label + '</button>';
      }).join('') + '</div>' : '') + '</li>';
  }).join('') + '</ol>';
  var box = document.getElementById('timeline');
  box.innerHTML = html;
  if (!box.dataset.wired) {
    box.dataset.wired = 1;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-d]'); if (!b || b.disabled) return;
      onPick(b.dataset.d, b.dataset.k || ''); closeDrawer();
    });
    var fab = document.getElementById('tlBtn');
    if (fab) fab.addEventListener('click', function () { document.body.classList.toggle('drawer'); });
    var scrim = document.getElementById('scrim');
    if (scrim) scrim.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }
}
function closeDrawer() { document.body.classList.remove('drawer'); }

/* ---------- 数据：按期拆分，用 <script> 动态加载（file:// 也能用） ---------- */
var AIT = {
  idx: {}, info: null, data: { d: {}, k: {} }, wait: {},
  index: function (t, list, info) { this.idx[t] = list; this.info = info; },
  put: function (t, id, obj) {
    this.data[t][id] = obj;
    var w = this.wait[t + id]; delete this.wait[t + id];
    (w || []).forEach(function (f) { f(obj); });
  },
  load: function (t, id, cb) {
    if (this.data[t][id]) return cb(this.data[t][id]);
    var key = t + id, self = this;
    if (this.wait[key]) return this.wait[key].push(cb);
    this.wait[key] = [cb];
    var s = document.createElement('script');
    s.src = 'data/' + t + '/' + id + '.js' + (this.info ? '?v=' + encodeURIComponent(this.info.built) : '');
    s.onerror = function () { var w = self.wait[key]; delete self.wait[key]; (w || []).forEach(function (f) { f(null); }); };
    document.head.appendChild(s);
  },
  loadAll: function (t, ids, cb) {
    var left = ids.length, out = {}, self = this;
    if (!left) return cb(out);
    ids.forEach(function (id) { self.load(t, id, function (o) { out[id] = o; if (--left === 0) cb(out); }); });
  }
};

/* ---------- 浏览模式：单列 / 双列 / 三列（两个页面共用 localStorage 键 aitoday.cols） ---------- */
var COLS_KEY = 'aitoday.cols';
function wantCols() { var w = +(qs('cols') || (function () { try { return localStorage.getItem(COLS_KEY); } catch (x) { return 0; } })() || 1); return [1, 2, 3].indexOf(w) < 0 ? 1 : w; }
function effCols(want) { var w = window.innerWidth; return w < 700 ? 1 : (w < 1100 ? Math.min(want, 2) : want); }
function setupCols(draw) {
  var want = wantCols(), last = 0;
  function apply(force) {
    var n = effCols(want);
    if (!force && n === last) return;
    last = n;
    document.getElementById('shell').className = 'shell c' + n;
    document.body.setAttribute('data-cols', n); document.documentElement.setAttribute('data-cols', n);
    document.querySelectorAll('#cols button').forEach(function (b) { b.classList.toggle('on', +b.dataset.c === want); b.setAttribute('aria-checked', +b.dataset.c === want); });
    draw(n);
  }
  document.getElementById('cols').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    want = +b.dataset.c; try { localStorage.setItem(COLS_KEY, want); } catch (x) {}
    setQs({ cols: '' }); apply(true);
  });
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { apply(false); }, 150); });
  return apply;
}

/* ---------- 骨架屏 ---------- */
function skelCard(kind, i) {
  var img = i % 3 !== 1;
  if (kind === 'x') return '<div class="sk-card sk-x" aria-hidden="true"><div class="sk-row"><span class="sk sk-av"></span><span class="sk sk-name"></span></div>' +
    '<span class="sk sk-chip"></span><span class="sk sk-l"></span><span class="sk sk-l"></span><span class="sk sk-l s"></span>' + (img ? '<span class="sk sk-img"></span>' : '') + '<span class="sk sk-f"></span></div>';
  return '<div class="sk-card" aria-hidden="true"><span class="sk sk-k"></span><span class="sk sk-h"></span><span class="sk sk-l"></span><span class="sk sk-l"></span><span class="sk sk-l"></span><span class="sk sk-l s"></span>' +
    (img ? '<span class="sk sk-img"></span>' : '') + '<span class="sk sk-f"></span></div>';
}
function skelFeed(kind, n, per) {
  var h = '';
  for (var c = 0; c < n; c++) { h += '<div class="col">'; for (var j = 0; j < per; j++) h += skelCard(kind, c + j); h += '</div>'; }
  return h;
}
function showSkeleton(kind) {
  var feed = document.getElementById('feed'), n = effCols(wantCols());
  feed.classList.add('loading'); feed.innerHTML = skelFeed(kind, n, 3);
  var more = document.getElementById('more'); if (more) more.hidden = true;
}

/* ---------- 分批渲染（瀑布流）：先出一屏，滚到底部再加载下一批 ---------- */
var PAGER = { gen: 0, io: null };
function pagedMasonry(feed, htmls, n, opts) {
  opts = opts || {};
  var batch = opts.batch || (n === 1 ? 6 : n * 4), kind = opts.kind || 'card', gen = ++PAGER.gen, pos = 0;
  var more = document.getElementById('more');
  feed.classList.remove('loading');
  feed.innerHTML = Array(n + 1).join('<div class="col"></div>');
  var cols = feed.children;
  more.querySelector('.more-sk').innerHTML = skelFeed(kind, n, 1);
  function next() {
    if (gen !== PAGER.gen) return;
    var end = Math.min(htmls.length, pos + batch);
    for (; pos < end; pos++) {
      var best = cols[0];
      for (var c = 1; c < cols.length; c++) if (cols[c].offsetHeight < best.offsetHeight - 4) best = cols[c];
      best.insertAdjacentHTML('beforeend', htmls[pos]);
    }
    wirePics(feed);
    if (opts.after) opts.after(feed);
    var rest = htmls.length - pos;
    more.hidden = rest <= 0;
    more.querySelector('.more-btn').textContent = '加载更多（还有 ' + rest + ' 条）';
    busy = false;
  }
  var busy = false;
  function ask() { if (busy || pos >= htmls.length || gen !== PAGER.gen) return; busy = true; setTimeout(next, 160); }
  if (PAGER.io) PAGER.io.disconnect();
  if ('IntersectionObserver' in window) {
    PAGER.io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) ask(); }, { rootMargin: '600px 0px' });
    PAGER.io.observe(more);
  }
  more.querySelector('.more-btn').onclick = ask;
  PAGER.all = function () { while (gen === PAGER.gen && pos < htmls.length) next(); };  // 截图/调试用：一次全部渲染
  next();
}

/* ---------- 图片：可爱的加载动画 → 加载完淡入；失败显示「图片走丢了」。r = 宽/高，用来预留位置 ---------- */
var BOT = '<span class="pic-bot" aria-hidden="true"><b><i></i><i></i></b><s><em></em><em></em><em></em></s></span>';
function pic(src, r, cls, eager) {
  var st = r ? ' style="aspect-ratio:' + (+r).toFixed(3) + '"' : '';
  return '<span class="pic ' + (cls || '') + '"' + st + '>' + BOT + '<img ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" src="' + esc(src) + '" alt=""></span>';
}
function picDone(img) {
  var box = img.parentNode; if (!box || !box.classList || !box.classList.contains('pic')) return;
  if (img.naturalWidth > 0) box.classList.add('ok'); else box.classList.add('err');
}
function wirePics(root) {
  (root || document).querySelectorAll('.pic img').forEach(function (img) { if (img.complete) picDone(img); });
}
document.addEventListener('load', function (e) { if (e.target.tagName === 'IMG') picDone(e.target); }, true);
document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') picDone(e.target); }, true);

/* ---------- 站内原帖查看器（X 风格，不跳转外链） ---------- */
var TW_ICON = {
  r: '<svg viewBox="0 0 24 24"><path d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.47 0 8.13 3.62 8.13 8.1 0 2.95-1.6 5.66-4.18 7.08L10 21.5v-3.75h-.25c-4.42 0-8-3.58-8-7.75zm8-6c-3.31 0-6 2.69-6 6 0 3.36 2.73 5.75 6.07 5.75H12v2.4l5.12-2.83c1.95-1.07 3.13-3.1 3.13-5.32 0-3.37-2.75-6-6.13-6H9.75z"/></svg>',
  rt: '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.43 4.14-1.37 1.46L5.5 7.55V16c0 1.1.9 2 2 2H13v2H7.5c-2.21 0-4-1.79-4-4V7.55L1.44 9.48.07 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.21 0 4 1.79 4 4v8.45l2.06-1.93 1.37 1.46-4.43 4.14-4.43-4.14 1.37-1.46 2.06 1.93V8c0-1.1-.9-2-2-2z"/></svg>',
  l: '<svg viewBox="0 0 24 24"><path d="M16.7 3.5c-1.98 0-3.6 1.04-4.7 2.62C10.9 4.54 9.28 3.5 7.3 3.5 4.34 3.5 2 5.93 2 9.03c0 5.31 6.46 9.73 9.5 11.47.31.18.69.18 1 0C15.54 18.76 22 14.34 22 9.03 22 5.93 19.66 3.5 16.7 3.5zm-4.7 15c-3.27-1.98-8-5.66-8-9.47C4 7.04 5.47 5.5 7.3 5.5c1.64 0 2.94 1.14 3.75 2.86h1.9C13.76 6.64 15.06 5.5 16.7 5.5c1.83 0 3.3 1.54 3.3 3.53 0 3.81-4.73 7.49-8 9.47z"/></svg>',
  v: '<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>'
};
function twNum(n) { n = +n || 0; if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿'; if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万'; return n ? String(n) : ''; }
function twRich(t) {
  return esc(t || '').replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (_, u, d) {
    if (/^https?:\/\/(www\.)?(x\.com|twitter\.com)\b/i.test(u)) return esc(d);
    return '<a href="' + u + '" target="_blank" rel="noopener">' + d + '</a>';
  }).replace(/(^|[^\w@])@(\w{1,15})/g, '$1<span class="at">@$2</span>')
    .replace(/(^|\s)#([^\s#]+)/g, '$1<span class="at">#$2</span>');
}
function twAv(a, cls) {
  a = a || {};
  return a.av ? pic(a.av, 1, cls, true) : '<span class="' + cls + ' ph">' + esc((a.n || a.h || '?').slice(0, 1)) + '</span>';
}
function twMedia(m) {
  m = m || [];
  if (!m.length) return '';
  var one = m.length === 1, r = one && m[0].w && m[0].h ? Math.min(2, Math.max(0.8, m[0].w / m[0].h)) : 0;
  return '<div class="media n' + Math.min(m.length, 4) + '">' + m.slice(0, 4).map(function (x) {
    // 图片点开看本地原图；视频只展示封面，不跳转 X
    var inner = pic(x.t || x.src, one ? (r || 1.6) : 0);
    if (x.type === 'photo' && x.src) return '<button type="button" class="mi" data-full="' + esc(x.src) + '">' + inner + '</button>';
    return '<span class="mi' + (x.type !== 'photo' ? ' vid' : '') + '">' + inner + '</span>';
  }).join('') + '</div>';
}
function twMetrics(pm) {
  pm = pm || [0, 0, 0, 0];
  return '<div class="ta"><span>' + TW_ICON.r + twNum(pm[0]) + '</span><span>' + TW_ICON.rt + twNum(pm[1]) + '</span><span>' + TW_ICON.l + twNum(pm[2]) + '</span><span>' + TW_ICON.v + twNum(pm[3]) + '</span></div>';
}
function ensureTweetModal() {
  var m = document.getElementById('tweetModal');
  if (m) return m;
  m = document.createElement('div');
  m.id = 'tweetModal'; m.className = 'modal tweet-modal'; m.hidden = true;
  m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="原帖">' +
    '<div class="sheet-h" id="tweetMh"><div><b>原帖</b><em>离线存档</em></div><button type="button" class="x" aria-label="关闭">×</button></div>' +
    '<div class="tl" id="tweetMb"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function (e) {
    if (e.target.id === 'tweetModal' || e.target.closest('.x')) closeTweetViewer();
    var f = e.target.closest('[data-full]'); if (f && f.dataset.full) window.open(f.dataset.full, '_blank');
  });
  if (!ensureTweetModal._esc) {
    ensureTweetModal._esc = 1;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTweetViewer(); });
  }
  return m;
}
function closeTweetViewer() {
  var m = document.getElementById('tweetModal'); if (!m || m.hidden) return;
  m.classList.remove('show'); document.body.classList.remove('lock');
  setTimeout(function () { m.hidden = true; }, 200);
}
function openTweetViewer(post) {
  var m = ensureTweetModal(), mb = document.getElementById('tweetMb'), mh = document.getElementById('tweetMh');
  m.hidden = false; document.body.classList.add('lock');
  requestAnimationFrame(function () { m.classList.add('show'); });
  mh.innerHTML = '<div><b>原帖</b><em>离线存档 · 不跳转 X</em></div><button type="button" class="x" aria-label="关闭">×</button>';
  mb.scrollTop = 0;
  if (!post || !post.t) {
    mb.innerHTML = '<div class="tw-empty"><b>这条原帖还没存下来</b><p>本期速报里暂时没有离线正文，稍后再来看看。</p></div>';
    return;
  }
  var a = post.a || {};
  var ts = post.ts ? (post.ts.slice(5, 10).replace('-', '/') + ' ' + post.ts.slice(11, 16)) : '';
  mb.innerHTML = '<article class="tw tw-detail">' + twAv(a, 'tav') + '<div class="tb">' +
    '<div class="th"><b>' + esc(a.n || a.h || '未知作者') + '</b><span>@' + esc(a.h || '') + '</span></div>' +
    '<div class="tt">' + twRich(post.t) + '</div>' + twMedia(post.m) +
    (ts ? '<div class="tw-time">' + esc(ts) + ' · 北京时间</div>' : '') +
    twMetrics(post.pm) + '</div></article>';
  wirePics(m);
}
