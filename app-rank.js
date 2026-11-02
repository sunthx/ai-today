/* 模型排名页：读 window.LEADERBOARD（data/leaderboard.js），渲染可排序表格 */
(function () {
  var D = window.LEADERBOARD, T = document.getElementById('rkT');
  if (!D || !T) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var B = D.benchmarks, R = D.reference, M = D.models, NB = B.length;
  var sortKey = 'rank', sortDir = 1, filter = 'all';
  var fmt = function (b, x) { return x == null ? '—' : b.fmt === 'pct' ? (x * 100).toFixed(1) : Math.round(x); };
  var best = {};
  B.forEach(function (b) { var xs = M.map(function (m) { return m.v[b.key]; }).filter(function (x) { return x != null; }); best[b.key] = Math.max.apply(null, xs); });

  document.getElementById('rkEye').textContent = '汇总 ' + NB + ' 项主流测评 · ' + M.length + ' 个模型';
  document.getElementById('rkHow').textContent = '大白话：每项测评先换算成 0–100 分（本表里最好的记 100、最差的记 0），再把模型有成绩的各项取平均，就是综合分；至少有 ' + D.minCoverage + ' 项成绩才排名。';

  var cols = [
    { k: 'rank', l: '排名', c: 'c-rk', n: 1 },
    { k: 'name', l: '模型', c: 'c-m' },
    { k: 'org', l: '厂商', c: 'c-org' },
    { k: 'open', l: '开源', c: 'c-op', tip: '开源 = 公开了模型权重，可以自己下载部署' },
    { k: 'score', l: '综合分', c: 'c-sc', n: 1, tip: '各项换算成 0–100 后的平均分；旁边的小字（如 9/9）是有成绩的项数' }
  ].concat(B.map(function (b) { return { k: b.key, l: b.name, c: 'c-b', n: 1, tip: b.zh, b: b }; }))
   .concat([{ k: 'aaIndex', l: 'AA 指数', c: 'c-b c-ref', n: 1, tip: R.zh }]);

  var val = function (m, k) {
    if (k === 'rank') return m.rank == null ? 1e9 : m.rank;
    if (k === 'name' || k === 'org') return (m[k] || '').toLowerCase();
    if (k === 'open') return m.open ? 1 : 0;
    if (k === 'score' || k === 'aaIndex') return m[k];
    return m.v[k];
  };

  function head() {
    T.tHead.innerHTML = '<tr>' + cols.map(function (c) {
      var on = c.k === sortKey, aria = on ? (sortDir > 0 ? 'ascending' : 'descending') : 'none';
      return '<th class="' + c.c + (on ? ' on' : '') + '" aria-sort="' + aria + '" scope="col"><button type="button" data-k="' + c.k + '"' +
        (c.tip ? ' data-tip="' + esc(c.tip) + '"' : '') + '>' + esc(c.l) + (c.tip ? '<i class="q" aria-hidden="true">?</i>' : '') +
        '<span class="ar" aria-hidden="true">' + (on ? (sortDir > 0 ? '↑' : '↓') : '') + '</span></button></th>';
    }).join('') + '</tr>';
  }

  function body() {
    var rows = M.filter(function (m) { return filter === 'all' || (filter === 'open') === m.open; });
    rows.sort(function (a, b) {
      var x = val(a, sortKey), y = val(b, sortKey);
      if (x == null && y == null) return (a.rank || 1e9) - (b.rank || 1e9);
      if (x == null) return 1; if (y == null) return -1;
      if (x < y) return -sortDir; if (x > y) return sortDir;
      return (a.rank || 1e9) - (b.rank || 1e9);
    });
    T.tBodies[0].innerHTML = rows.map(function (m) {
      var cells = '<td class="c-rk">' + (m.rank == null ? '—' : m.rank) + '</td>' +
        '<th class="c-m" scope="row"><span class="mn">' + esc(m.name) + '</span>' + (m.variant ? '<span class="mv">' + esc(m.variant) + '</span>' : '') + '</th>' +
        '<td class="c-org">' + esc(m.org) + '</td>' +
        '<td class="c-op">' + (m.open ? '<span class="tag o">开源</span>' : '<span class="tag">闭源</span>') + '</td>' +
        '<td class="c-sc">' + (m.score == null ? '<span class="na">未排名</span>' :
          '<span class="sv">' + m.score.toFixed(1) + '</span><span class="sb"><i style="width:' + m.score + '%"></i></span>') +
          '<span class="cv">' + m.cov + '/' + NB + '</span></td>' +
        B.map(function (b) {
          var x = m.v[b.key], top = x != null && x === best[b.key];
          return '<td class="c-b' + (x == null ? ' na' : '') + (top ? ' best' : '') + '">' + fmt(b, x) + '</td>';
        }).join('') +
        '<td class="c-b c-ref' + (m.aaIndex == null ? ' na' : '') + '">' + (m.aaIndex == null ? '—' : m.aaIndex.toFixed(1)) + '</td>';
      return '<tr>' + cells + '</tr>';
    }).join('');
  }

  function render() { head(); body(); }
  render();

  T.tHead.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-k]'); if (!btn) return;
    if (e.target.closest('.q')) { e.stopPropagation(); return; }
    var k = btn.getAttribute('data-k'), c = cols.filter(function (x) { return x.k === k; })[0];
    if (k === sortKey) sortDir = -sortDir; else { sortKey = k; sortDir = (c.n && k !== 'rank') ? -1 : 1; if (k === 'open') sortDir = -1; }
    hideTip(); render();
  });

  document.querySelector('.rk-chips').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-f]'); if (!b) return;
    filter = b.getAttribute('data-f');
    [].forEach.call(this.children, function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
    body();
  });

  /* 测评说明浮层：悬停 / 键盘聚焦 / 手机上轻点问号 */
  var tip = document.getElementById('rkTip'), cur = null, shownAt = 0;
  var onScroll = function () { if (cur && Date.now() - shownAt > 400) hideTip(); };
  function showTip(btn) {
    var t = btn.getAttribute('data-tip'); if (!t) return;
    cur = btn; shownAt = Date.now(); tip.textContent = t; tip.hidden = false;
    var r = btn.getBoundingClientRect(), w = tip.offsetWidth, vw = document.documentElement.clientWidth;
    var x = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2));
    tip.style.left = x + 'px'; tip.style.top = (r.bottom + 8) + 'px';
  }
  function hideTip() { tip.hidden = true; cur = null; }
  T.tHead.addEventListener('mouseover', function (e) { var b = e.target.closest('button[data-tip]'); if (b && b !== cur) showTip(b); });
  T.tHead.addEventListener('mouseleave', hideTip);
  T.tHead.addEventListener('focusin', function (e) { var b = e.target.closest('button[data-tip]'); if (b) showTip(b); });
  T.tHead.addEventListener('focusout', hideTip);
  T.tHead.addEventListener('click', function (e) { var q = e.target.closest('.q'); if (!q) return; showTip(q.closest('button')); }, true);
  document.addEventListener('click', function (e) { if (cur && !e.target.closest('.rk-t thead')) hideTip(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.getElementById('rkScroll').addEventListener('scroll', onScroll, { passive: true });

  /* 底部：方法、来源、更新时间 */
  var src = {};
  B.forEach(function (b) { (src[b.url] = src[b.url] || { name: b.source, url: b.url, fetched: b.fetched, note: b.note, items: [] }).items.push(b.name); });
  (src[R.url] = src[R.url] || { name: 'Artificial Analysis', url: R.url, fetched: R.fetched, items: [] }).items.push(R.name + '（仅参考）');
  document.getElementById('rkFoot').innerHTML =
    '<h2>怎么算的</h2><ul class="rk-notes">' +
    '<li>同一模型有多个“思考档位”时，只取一个最强档位（模型名旁的小字）；ARC-AGI-2 取该模型在榜上最好的一档。</li>' +
    '<li>百分比类测评显示的是答对率（%）；GDPval 和 LMArena 是 Elo 分，越高越好。</li>' +
    '<li>榜单上找不到同一版本的就留空 “—”，不拿相近版本顶替，也不估算。</li>' +
    '<li>AA 指数是 Artificial Analysis 自家的合成分，只作参考，不计入综合分。</li></ul>' +
    '<h2>数据来源</h2><ul class="rk-src">' + Object.keys(src).map(function (u) {
      var s = src[u];
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a><span>' + esc(s.items.join('、')) + ' · 抓取于 ' + esc(s.fetched) + (s.note ? '（' + esc(s.note) + '）' : '') + '</span></li>';
    }).join('') + '</ul>' +
    '<p class="rk-upd">数据更新于 ' + esc(D.updated) + '（北京时间）</p>';
})();
