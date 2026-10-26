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
    var end = Math.min(htmls.length, pos + batch), fresh = [];
    for (; pos < end; pos++) {
      var best = cols[0];
      for (var c = 1; c < cols.length; c++) if (cols[c].offsetHeight < best.offsetHeight - 4) best = cols[c];
      best.insertAdjacentHTML('beforeend', htmls[pos]);
      fresh.push(best.lastElementChild);
    }
    // 渲染过一帧（真实高度被记住）后再开启离屏跳过渲染
    if (fresh.length) requestAnimationFrame(function () { setTimeout(function () { fresh.forEach(function (el) { if (el) el.classList.add('cv'); }); }, 0); });
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
  if (!more._w) { more._w = 1; watchAnim(more); }
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
  if (ANIM_IO && box._w) { ANIM_IO.unobserve(box); box.classList.remove('in'); }
}
/* 只让屏幕附近的加载动画播放 */
var ANIM_IO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { e.target.classList.toggle('in', e.isIntersecting); });
}, { rootMargin: '200px 0px' }) : null;
function watchAnim(el) { if (ANIM_IO) ANIM_IO.observe(el); else el.classList.add('in'); }
function wirePics(root) {
  (root || document).querySelectorAll('.pic img').forEach(function (img) {
    if (img.complete) picDone(img);
    var box = img.parentNode;
    if (box && !box._w && !box.classList.contains('ok')) { box._w = 1; watchAnim(box); }
  });
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
  m = (m || []).filter(function (x) { return x && (x.t || x.src); }); // 没有真实图片就不显示图片区
  if (!m.length) return '';
  var one = m.length === 1, r = one && m[0].w && m[0].h ? Math.min(2, Math.max(0.8, m[0].w / m[0].h)) : 0;
  return '<div class="media n' + Math.min(m.length, 4) + '">' + m.slice(0, 4).map(function (x) {
    // 图片点开看本地原图；视频只展示封面，不跳转 X
    var inner = pic(x.t || x.src, one ? (r || 1.6) : 0);
    if (x.type === 'photo' && x.src) return '<button type="button" class="mi" data-full="' + esc(x.src) + '"' + (x.w && x.h ? ' data-w="' + x.w + '" data-h="' + x.h + '"' : '') + ' aria-label="查看大图">' + inner + '</button>';
    return '<span class="mi' + (x.type !== 'photo' ? ' vid' : '') + '">' + inner + '</span>';
  }).join('') + '</div>';
}
function twMetrics(pm) {
  pm = pm || [0, 0, 0, 0];
  return '<div class="ta"><span>' + TW_ICON.r + twNum(pm[0]) + '</span><span>' + TW_ICON.rt + twNum(pm[1]) + '</span><span>' + TW_ICON.l + twNum(pm[2]) + '</span><span>' + TW_ICON.v + twNum(pm[3]) + '</span></div>';
}
/* ---------- 英文帖的中文译文：译文在构建时已写进数据（帖子的 tz 字段），切换不发任何请求 ----------
   默认显示原文；点「以后默认显示中文」会记在 localStorage（aitoday.tr = 1），两个页面通用 */
var TR_KEY = 'aitoday.tr', TRS = {};
function trDefault() { try { return localStorage.getItem(TR_KEY) === '1'; } catch (x) { return false; } }
function trBar(zh) {
  return zh ? '<span class="trn" title="Grok Bot 提前翻译">译文</span><i>·</i><button type="button" class="trb">显示原文</button><i>·</i><button type="button" class="trd">' + (trDefault() ? '改回默认原文' : '总是显示中文') + '</button>'
    : '<button type="button" class="trb">显示中文</button>';
}
// 正文 + 译文切换条。clamp=true（KOL 卡片的长文）时先折叠，后面跟「展开全文」
function twText(p, clamp) {
  var has = !!(p && p.tz && p.id), zh = has && trDefault(), t = zh ? p.tz : (p && p.t);
  if (has) TRS[p.id] = { t: p.t, tz: p.tz };
  return '<div class="tt' + (clamp ? ' clamp" data-cl="1' : '') + '"' + (zh ? ' lang="zh-CN"' : '') + '>' + twRich(t) + '</div>' +
    (clamp ? '<button class="more">展开全文</button>' : '') +
    (has ? '<div class="trw' + (zh ? ' on' : '') + '" data-pid="' + esc(p.id) + '">' + trBar(zh) + '</div>' : '');
}
function trApply(w, zh) {
  var d = TRS[w.dataset.pid], tt = w.parentNode.querySelector('.tt'); if (!d || !tt) return;
  tt.innerHTML = twRich(zh ? d.tz : d.t);
  if (zh) tt.setAttribute('lang', 'zh-CN'); else tt.removeAttribute('lang');
  w.classList.toggle('on', zh); w.innerHTML = trBar(zh);
  if (tt.dataset.cl) {  // KOL 卡片：换了文字要重新判断要不要折叠
    var mo = tt.nextElementSibling; if (!mo || !mo.classList.contains('more')) mo = null;
    var open = mo && !mo.hidden && mo.textContent === '收起';
    tt.classList.add('clamp');
    var cut = tt.scrollHeight > tt.clientHeight + 2;
    if (open || !cut) tt.classList.remove('clamp');
    if (mo) { mo.hidden = !cut; mo.textContent = open && cut ? '收起' : '展开全文'; }
  }
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('.trw button'); if (!b) return;
  var w = b.parentNode;
  if (b.classList.contains('trb')) { trApply(w, !w.classList.contains('on')); var nb = w.querySelector('.trb'); if (nb) nb.focus({ preventScroll: true }); return; }
  // 改默认：记住选择，页面上所有有译文的帖子一起切换
  var on = !trDefault(); try { localStorage.setItem(TR_KEY, on ? '1' : '0'); } catch (x) {}
  document.querySelectorAll('.trw').forEach(function (x) { trApply(x, on || x === w); });
});
var X_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>';
function twUrl(post, url) {
  if (post && post.u) return post.u;
  if (url) return url;
  var id = post && post.id, h = post && post.a && post.a.h;
  return id ? (h ? 'https://x.com/' + h + '/status/' + id : 'https://x.com/i/status/' + id) : '';
}
/* 只建一次弹层节点，之后复用；动画只用 transform/opacity */
var TWM = null;
function ensureTweetModal() {
  if (TWM) return TWM;
  var m = document.createElement('div');
  m.id = 'tweetModal'; m.className = 'modal tweet-modal'; m.hidden = true;
  m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="原帖">' +
    '<div class="sheet-h" id="tweetMh"><div><b>原帖</b></div>' +
    '<a class="tw-jump" id="tweetJump" href="#" target="_blank" rel="noopener" hidden>' + X_LOGO + '<span>跳转 X</span></a>' +
    '<button type="button" class="x" aria-label="关闭">×</button></div>' +
    '<div class="tl" id="tweetMb"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function (e) {
    if (e.target === m || e.target.closest('.x')) { closeTweetViewer(); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTweetViewer(); });
  TWM = { m: m, mb: m.querySelector('#tweetMb'), jump: m.querySelector('#tweetJump'), t: 0 };
  return TWM;
}
function closeTweetViewer() {
  if (!TWM || TWM.m.hidden) return;
  var m = TWM.m;
  m.classList.remove('show'); var km = document.getElementById('modal'); if (!km || km.hidden) document.documentElement.classList.remove('lock');
  clearTimeout(TWM.t); TWM.t = setTimeout(function () { m.hidden = true; TWM.mb.innerHTML = ''; }, 160);
}
function openTweetViewer(post, url) {
  var w = ensureTweetModal(), m = w.m, mb = w.mb;
  clearTimeout(w.t);
  var href = twUrl(post, url);
  w.jump.hidden = !href; if (href) w.jump.href = href;
  if (!post || !post.t) {
    mb.innerHTML = '<div class="tw-empty"><b>这条原帖还没存下来</b><p>本期速报里暂时没有离线正文' + (href ? '，可以点右上角「跳转 X」看原帖。' : '，稍后再来看看。') + '</p></div>';
  } else {
    var a = post.a || {};
    var ts = post.ts ? (post.ts.slice(5, 10).replace('-', '/') + ' ' + post.ts.slice(11, 16)) : '';
    mb.innerHTML = '<article class="tw tw-detail">' + (a.av ? pic(a.av, 1, 'tav') : twAv(a, 'tav')) + '<div class="tb">' +
      '<div class="th"><b>' + esc(a.n || a.h || '未知作者') + '</b><span>@' + esc(a.h || '') + '</span></div>' +
      twText(post, false) + twMedia(post.m) +
      (ts ? '<div class="tw-time">' + esc(ts) + ' · 北京时间</div>' : '') +
      twMetrics(post.pm) + '</div></article>';
  }
  mb.scrollTop = 0;
  m.hidden = false; document.documentElement.classList.add('lock');
  requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('show'); wirePics(mb); }); });
}

/* ---------- 站内看图（灯箱）：一个复用节点；只动 opacity/transform ---------- */
var LB = null;
function anyModalOpen() {
  var km = document.getElementById('modal');
  return (km && !km.hidden) || (TWM && !TWM.m.hidden && TWM.m.classList.contains('show'));
}
function ensureLightbox() {
  if (LB) return LB;
  var m = document.createElement('div');
  m.className = 'lb'; m.hidden = true;
  m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', '查看图片');
  m.innerHTML = '<div class="lb-stage"><img class="lb-img" alt="" draggable="false"></div>' +
    '<span class="lb-load" aria-hidden="true"></span>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="上一张"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="下一张"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<span class="lb-n"></span><button type="button" class="lb-btn lb-x" aria-label="关闭">×</button>';
  document.body.appendChild(m);
  var L = LB = { m: m, st: m.querySelector('.lb-stage'), img: m.querySelector('.lb-img'), n: m.querySelector('.lb-n'),
    prev: m.querySelector('.lb-prev'), next: m.querySelector('.lb-next'), list: [], i: 0, s: 1, x: 0, y: 0, t: 0, tok: 0 };
  var img = L.img;
  function apply(anim) {
    img.style.transition = anim ? 'transform .15s ease-out' : 'none';
    img.style.transform = 'translate3d(' + L.x + 'px,' + L.y + 'px,0) scale(' + L.s + ')';
  }
  function clamp() {
    var w = img.offsetWidth * L.s, h = img.offsetHeight * L.s, mx = Math.max(0, (w - innerWidth) / 2), my = Math.max(0, (h - innerHeight) / 2);
    if (L.s <= 1) { L.s = 1; L.x = 0; L.y = 0; return; }
    L.x = Math.max(-mx, Math.min(mx, L.x)); L.y = Math.max(-my, Math.min(my, L.y));
  }
  // 以 (cx,cy) 为中心缩放到 s
  function zoomTo(s, cx, cy, anim) {
    s = Math.max(1, Math.min(5, s));
    var ox = cx - innerWidth / 2, oy = cy - innerHeight / 2, k = s / L.s;
    L.x = ox - (ox - L.x) * k; L.y = oy - (oy - L.y) * k; L.s = s; clamp(); apply(anim);
    m.classList.toggle('zoomed', L.s > 1);
  }
  L.reset = function () { L.s = 1; L.x = 0; L.y = 0; apply(false); m.classList.remove('zoomed'); };
  L.zoomTo = zoomTo;
  function fit(w, h) {  // 适配视口，不超过原图尺寸
    var mw = innerWidth - (innerWidth < 600 ? 16 : 120), mh = innerHeight - (innerWidth < 600 ? 96 : 110);
    var k = Math.min(mw / w, mh / h, L.cap ? 1 : 9);
    img.style.width = Math.round(w * k) + 'px'; img.style.height = Math.round(h * k) + 'px';
  }
  L.fit = fit;
  L.show = function (i) {
    var n = L.list.length; if (!n) return;
    L.i = (i + n) % n; var it = L.list[L.i], tok = ++L.tok;
    L.reset(); L.cap = false;
    m.classList.toggle('multi', n > 1); L.n.textContent = n > 1 ? (L.i + 1) + ' / ' + n : '';
    m.classList.add('loading');
    L.ratio = it.w && it.h ? [it.w, it.h] : null;
    if (L.ratio) fit(L.ratio[0], L.ratio[1]);
    img.onload = function () { if (tok === L.tok && !L.ratio) { L.ratio = [img.naturalWidth, img.naturalHeight]; fit(L.ratio[0], L.ratio[1]); } };
    img.src = it.thumb || it.full;
    if (img.complete && img.naturalWidth && !L.ratio) { L.ratio = [img.naturalWidth, img.naturalHeight]; fit(L.ratio[0], L.ratio[1]); }
    var full = new Image(); full.decoding = 'async';
    full.onload = function () {
      if (tok !== L.tok) return;
      var go = function () { if (tok !== L.tok) return; L.cap = true; L.ratio = [full.naturalWidth, full.naturalHeight]; img.src = full.src; fit(L.ratio[0], L.ratio[1]); m.classList.remove('loading'); };
      if (full.decode) full.decode().then(go, go); else go();
    };
    full.onerror = function () { if (tok === L.tok) m.classList.remove('loading'); };
    full.src = it.full;
    // 预取相邻一张
    if (n > 1) { var nx = L.list[(L.i + 1) % n]; if (nx && !nx.pre) { nx.pre = 1; (new Image()).src = nx.full; } }
  };
  L.go = function (d) { if (L.list.length > 1) L.show(L.i + d); };
  L.prev.onclick = function (e) { e.stopPropagation(); L.go(-1); };
  L.next.onclick = function (e) { e.stopPropagation(); L.go(1); };
  m.querySelector('.lb-x').onclick = function (e) { e.stopPropagation(); closeLightbox(); };
  // 点空白处关闭（拖动/缩放后的点击不算）
  m.addEventListener('click', function (e) {
    if (L.moved) { L.moved = false; return; }
    var t = L.down || e.target;  // 指针捕获会改写目标，用按下时的元素判断
    if (t === m || t === L.st) closeLightbox();
  });
  m.addEventListener('dblclick', function (e) {
    if ((L.down || e.target) !== img) return;
    if (L.s > 1) { L.s = 1; L.x = 0; L.y = 0; apply(true); m.classList.remove('zoomed'); } else zoomTo(2.5, e.clientX, e.clientY, true);
  });
  m.addEventListener('wheel', function (e) {
    e.preventDefault();
    var s = L.s * Math.exp(-Math.max(-100, Math.min(100, e.deltaY)) * 0.004);
    zoomTo(s, e.clientX, e.clientY, false);
  }, { passive: false });
  // 指针：放大后拖动；没放大时左右滑切图；双指捏合缩放；轻点两下放大
  var pts = {}, start = null, pinch = null, lastTap = 0, raf = 0;
  function sched() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; apply(false); }); }
  m.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.lb-btn')) return;
    if (!Object.keys(pts).length) L.down = e.target;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 2) {
      var a = pts[ids[0]], b = pts[ids[1]];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: L.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; start = null; return;
    }
    start = { x: e.clientX, y: e.clientY, tx: L.x, ty: L.y, t: Date.now() };
    L.moved = false;
    try { m.setPointerCapture(e.pointerId); } catch (_) {}
  });
  m.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch) {
      var ids = Object.keys(pts); if (ids.length < 2) return;
      var a = pts[ids[0]], b = pts[ids[1]];
      L.moved = true; zoomTo(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, pinch.cx, pinch.cy, false); return;
    }
    if (!start) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) L.moved = true;
    if (L.s > 1) { L.x = start.tx + dx; L.y = start.ty + dy; clamp(); sched(); }
    else if (L.list.length > 1 && e.pointerType !== 'mouse') { L.x = dx; sched(); }
  });
  function up(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId];
    if (pinch) { if (Object.keys(pts).length < 2) { pinch = null; clamp(); apply(true); m.classList.toggle('zoomed', L.s > 1); } return; }
    if (!start) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y, st = start; start = null;
    if (L.s > 1) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2 && L.list.length > 1) { L.moved = true; L.go(dx < 0 ? 1 : -1); return; }
    if (L.x) { L.x = 0; apply(true); }
    // 触屏轻点两下放大
    if (e.pointerType !== 'mouse' && !L.moved && L.down === img) {
      var now = Date.now();
      if (now - lastTap < 300) { lastTap = 0; L.moved = true; if (L.s > 1) L.reset(); else zoomTo(2.5, e.clientX, e.clientY, true); }
      else lastTap = now;
    }
  }
  m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
  // 键盘：捕获阶段处理，Esc 只关灯箱，不连带关掉下面的原帖弹窗
  window.addEventListener('keydown', function (e) {
    if (m.hidden || !m.classList.contains('show')) return;
    if (e.key === 'Escape') { closeLightbox(); } else if (e.key === 'ArrowLeft') L.go(-1); else if (e.key === 'ArrowRight') L.go(1); else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  window.addEventListener('resize', function () { if (!m.hidden && L.ratio) { fit(L.ratio[0], L.ratio[1]); L.reset(); } });
  return L;
}
function openLightbox(list, i) {
  if (!list || !list.length) return;
  var L = ensureLightbox(), m = L.m;
  clearTimeout(L.t);
  L.list = list; L.wasLocked = document.documentElement.classList.contains('lock');
  m.hidden = false; document.documentElement.classList.add('lock');
  L.show(i || 0);
  requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('show'); }); });
}
function closeLightbox() {
  if (!LB || LB.m.hidden) return;
  var L = LB, m = L.m; L.tok++;
  m.classList.remove('show');
  if (!anyModalOpen()) document.documentElement.classList.remove('lock');
  clearTimeout(L.t); L.t = setTimeout(function () { m.hidden = true; L.img.removeAttribute('src'); L.reset(); }, 160);
}
// 全站：点任何带 data-full 的图片都在站内打开，不开新标签页
document.addEventListener('click', function (e) {
  var f = e.target.closest && e.target.closest('[data-full]');
  if (!f || !f.dataset.full || (LB && LB.m.contains(f))) return;
  e.preventDefault(); e.stopPropagation();
  var group = f.closest('.media') || f.parentNode, els = [].slice.call(group.querySelectorAll('[data-full]'));
  if (els.indexOf(f) < 0) els = [f];
  var list = els.map(function (el) {
    var im = el.querySelector('img');
    return { full: el.dataset.full, thumb: im && im.complete && im.naturalWidth ? (im.currentSrc || im.src) : '', w: +el.dataset.w || 0, h: +el.dataset.h || 0 };
  });
  openLightbox(list, els.indexOf(f));
}, true);
