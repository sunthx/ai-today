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
  history.replaceState(null, '', '?' + p.toString());
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

/* 浏览模式：单列 / 双列 / 三列（两个页面共用 localStorage 键 aitoday.cols） */
var COLS_KEY = 'aitoday.cols';
function wantCols() { var w = +(qs('cols') || (function () { try { return localStorage.getItem(COLS_KEY); } catch (x) { return 0; } })() || 1); return [1, 2, 3].indexOf(w) < 0 ? 1 : w; }
function effCols(want) { var w = window.innerWidth; return w < 700 ? 1 : (w < 1100 ? Math.min(want, 2) : want); }
/* 把 htmls 依次放进当前最矮的一列（阅读顺序仍是从左到右）；图片都预留了比例，高度不会跳 */
function masonry(feed, htmls, n) {
  feed.innerHTML = Array(n + 1).join('<div class="col"></div>');
  var cols = feed.children;
  htmls.forEach(function (h) {
    var best = cols[0];
    for (var c = 1; c < cols.length; c++) if (cols[c].offsetHeight < best.offsetHeight - 4) best = cols[c];
    best.insertAdjacentHTML('beforeend', h);
  });
  wirePics(feed);
}
/* 一套布局控制：按钮、窗口缩放、字体加载后重排。draw(n) 负责按 n 列重画 */
function setupCols(draw) {
  var want = wantCols(), last = 0;
  function apply(force) {
    var n = effCols(want);
    if (!force && n === last) return;
    last = n;
    document.getElementById('shell').className = 'shell c' + n; document.body.setAttribute('data-cols', n);
    document.querySelectorAll('#cols button').forEach(function (b) { b.classList.toggle('on', +b.dataset.c === want); b.setAttribute('aria-checked', +b.dataset.c === want); });
    draw(n);
  }
  document.getElementById('cols').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    want = +b.dataset.c; try { localStorage.setItem(COLS_KEY, want); } catch (x) {}
    setQs({ cols: '' }); apply(true);
  });
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { apply(false); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (last > 1) apply(true); });
  return apply;
}

/* 图片：可爱的加载动画 → 加载完淡入；失败显示「图片走丢了」。r = 宽/高，用来预留位置 */
var BOT = '<span class="pic-bot" aria-hidden="true"><b><i></i><i></i></b><s><em></em><em></em><em></em></s></span>';
function pic(src, r, cls) {
  var st = r ? ' style="aspect-ratio:' + (+r).toFixed(3) + '"' : '';
  return '<span class="pic ' + (cls || '') + '"' + st + '>' + BOT + '<img loading="lazy" decoding="async" src="' + esc(src) + '" alt=""></span>';
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
