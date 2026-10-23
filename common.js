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
