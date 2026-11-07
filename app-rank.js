/* 模型排名页：读 window.LEADERBOARD（data/leaderboard.js），渲染可排序表格 + 数据来源弹窗 */
(function () {
  var D = window.LEADERBOARD, T = document.getElementById('rkT');
  if (!D || !T) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var M = D.models, B = D.benchmarks.filter(function (b) { return b.show; });
  var sortKey = 'rank', sortDir = 1;
  var fmt = function (b, x) { return x == null ? '—' : b.fmt === 'pct' ? (x * 100).toFixed(1) : b.fmt === 'num' ? x.toFixed(1) : Math.round(x); };
  var best = {}, lo = {};
  B.forEach(function (b) { var xs = M.map(function (m) { return m.v[b.key]; }).filter(function (x) { return x != null; }); best[b.key] = Math.max.apply(null, xs); lo[b.key] = Math.min.apply(null, xs); });
  var heat = function (b, x) { var r = best[b.key] - lo[b.key]; return r > 0 ? (x - lo[b.key]) / r : 1; };
  var hue = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  document.getElementById('rkSub').textContent = '前 ' + M.length + ' 名 · 综合 ' + D.total + ' 项主流测评';
  document.getElementById('rkUpd').textContent = '更新于 ' + D.updated + '（北京时间）';

  var cols = [{ k: 'rank', l: '#', c: 'c-rk', n: 1 }, { k: 'name', l: '模型', c: 'c-m' },
    { k: 'score', l: '综合分', c: 'c-sc', n: 1, tip: D.total + ' 项测评各自换算成 0–100 后的平均分' }]
    .concat(B.map(function (b, i) { return { k: b.key, l: b.name, c: 'c-b c-b' + i, n: 1, tip: b.zh, b: b }; }));
  var val = function (m, k) { return k === 'rank' ? m.rank : k === 'name' ? m.name.toLowerCase() : k === 'score' ? m.score : m.v[k]; };

  function head() {
    T.tHead.innerHTML = '<tr>' + cols.map(function (c) {
      var on = c.k === sortKey, aria = on ? (sortDir > 0 ? 'ascending' : 'descending') : 'none';
      return '<th class="' + c.c + (on ? ' on' : '') + '" aria-sort="' + aria + '" scope="col"><button type="button" data-k="' + c.k + '"' +
        (c.tip ? ' data-tip="' + esc(c.tip) + '"' : '') + '>' + esc(c.l) +
        '<span class="ar" aria-hidden="true">' + (on && c.k !== 'rank' ? (sortDir > 0 ? '↑' : '↓') : '') + '</span></button></th>';
    }).join('') + '</tr>';
  }
  function body() {
    var rows = M.slice().sort(function (a, b) {
      var x = val(a, sortKey), y = val(b, sortKey);
      if (x == null && y == null) return a.rank - b.rank;
      if (x == null) return 1; if (y == null) return -1;
      if (x < y) return -sortDir; if (x > y) return sortDir;
      return a.rank - b.rank;
    });
    T.tBodies[0].innerHTML = rows.map(function (m) {
      return '<tr><td class="c-rk"><span class="rn">' + m.rank + '</span></td>' +
        '<th class="c-m" scope="row"><span class="mw"><span class="og" aria-hidden="true" style="--oh:' + hue(m.org || m.name) + '">' + esc((m.org || m.name).charAt(0).toUpperCase()) + '</span>' +
        '<span class="mt"><span class="mn">' + esc(m.name) + '</span><span class="mv">' + esc([m.org, m.variant].filter(Boolean).join(' · ')) + '</span></span></span></th>' +
        '<td class="c-sc"><span class="sw"><span class="sv">' + m.score.toFixed(1) + '</span><span class="sb"><i style="width:' + m.score + '%"></i></span></span></td>' +
        B.map(function (b, i) {
          var x = m.v[b.key], top = x != null && x === best[b.key];
          return '<td class="c-b c-b' + i + (x == null ? ' na' : '') + (top ? ' best' : '') + '">' + (x == null ? '<span class="pn">—</span>' :
            '<span class="pv" style="--h:' + heat(b, x).toFixed(3) + '">' + fmt(b, x) + '</span>') + '</td>';
        }).join('') + '</tr>';
    }).join('');
  }
  function render() { head(); body(); }
  render();

  T.tHead.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-k]'); if (!btn) return;
    var k = btn.getAttribute('data-k'), c = cols.filter(function (x) { return x.k === k; })[0];
    if (k === sortKey) sortDir = -sortDir; else { sortKey = k; sortDir = (c.n && k !== 'rank') ? -1 : 1; }
    hideTip(); render();
  });

  /* 测评说明浮层：悬停 / 键盘聚焦（手机上长按表头也会触发 focus） */
  var tip = document.getElementById('rkTip'), cur = null;
  function showTip(btn) {
    var t = btn.getAttribute('data-tip'); if (!t) return;
    cur = btn; tip.textContent = t; tip.hidden = false;
    var r = btn.getBoundingClientRect(), w = tip.offsetWidth, vw = document.documentElement.clientWidth;
    tip.style.left = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; tip.style.top = (r.bottom + 8) + 'px';
  }
  function hideTip() { tip.hidden = true; cur = null; }
  T.tHead.addEventListener('mouseover', function (e) { var b = e.target.closest('button[data-tip]'); if (b && b !== cur) showTip(b); });
  T.tHead.addEventListener('mouseleave', hideTip);
  T.tHead.addEventListener('focusin', function (e) { var b = e.target.closest('button[data-tip]'); if (b && e.target.matches(':focus-visible')) showTip(b); });
  T.tHead.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', function () { if (cur) hideTip(); }, { passive: true });

  /* 数据来源弹窗 */
  var modal = document.getElementById('rkModal'), lastFocus = null;
  document.getElementById('rkMb').innerHTML = '<ul class="rk-src">' + D.sources.map(function (s) {
    return '<li><div class="rk-sh"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a><span>' + esc(s.date) + '</span></div>' +
      '<p>' + esc(s.zh) + (s.note ? '；' + esc(s.note) : '') + '</p><p class="rk-si">' + esc(s.items.join('、')) + '</p></li>';
  }).join('') + '</ul><p class="rk-mnote">分数照抄各榜单原始数据，找不到同一版本的显示 “—”，不估算。</p>';
  function open() { lastFocus = document.activeElement; modal.hidden = false; document.documentElement.style.overflow = 'hidden'; modal.querySelector('.rk-x').focus(); }
  function close() { modal.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.getElementById('rkSrcBtn').addEventListener('click', open);
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();
