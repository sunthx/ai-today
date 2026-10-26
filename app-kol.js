(function () {
  var EDS = (AIT.idx.k || []).map(function (e) { e.key = e.key || e.date + '/' + e.kind; return e; });
  var dates = []; EDS.forEach(function (e) { if (dates.indexOf(e.date) < 0) dates.push(e.date); });
  dates.sort().reverse();
  function ed(date, kind) { return EDS.filter(function (e) { return e.date === date && (!kind || e.kind === kind); }); }
  var cur = { date: qs('date'), kind: qs('ed') };
  if (!ed(cur.date).length) cur.date = dates[0] || '';
  if (!cur.kind || !ed(cur.date, cur.kind).length) { var l = ed(cur.date); cur.kind = l.length ? l[l.length - 1].kind : 'day'; }
  var K = null;  // 当前这一期的博主和精选帖子
  var q = '';
  function plain(t) { return (t || '').replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1'); }
  function av(k, cls) { return twAv(k, cls); }
  function hmTs(ts) { return ts.slice(5, 10).replace('-', '/') + ' ' + ts.slice(11, 16); }
  function heat(p) { return p.pm[2] + 2 * p.pm[1] + p.pm[0]; }
  function edLabel(key) { var e = EDS.filter(function (x) { return x.key === key; })[0]; return e ? md(e.date) + (e.kind === 'night' ? ' 夜间' : ' 白天') : ''; }
  // 一条帖子（X 样式）。inModal 时显示所属期次
  function postHtml(k, p, i, inModal) {
    return '<article class="tw' + (inModal ? '' : ' xcard') + '" data-pid="' + esc(p.id || '') + '" style="--i:' + Math.min(i, 20) + '">' +
      '<button class="who-btn" data-h="' + esc(k.h) + '" aria-label="看 ' + esc(k.n) + ' 的精选">' + av(k, 'tav') + '</button><div class="tb">' +
      '<div class="th"><button class="nm" data-h="' + esc(k.h) + '"><b>' + esc(k.n) + '</b><span>@' + esc(k.h) + '</span></button><span class="dt">· ' + esc(hmTs(p.ts)) + '</span></div>' +
      (p.why ? '<div class="why">' + (inModal ? '<i>' + esc(edLabel(p.ed)) + '</i>' : '') + esc(p.why) + '</div>' : (inModal ? '<div class="why"><i>' + esc(edLabel(p.ed)) + '</i></div>' : '')) +
      twText(p, !inModal && Math.max(plain(p.t).length, p.tz ? plain(p.tz).length * 2 : 0) > 260) + twMedia(p.m) +
      '<div class="ta"><span>' + TW_ICON.r + twNum(p.pm[0]) + '</span><span>' + TW_ICON.rt + twNum(p.pm[1]) + '</span><span>' + TW_ICON.l + twNum(p.pm[2]) + '</span><span>' + TW_ICON.v + twNum(p.pm[3]) + '</span>' +
      '<button type="button" class="op">查看原帖</button></div>' +
      '</div></article>';
  }
  function rows() {
    var key = cur.date + '/' + cur.kind, ql = q.toLowerCase(), out = [];
    (K || []).forEach(function (k) {
      var nameHit = ql && (k.n + ' ' + k.h).toLowerCase().indexOf(ql) >= 0;
      k.posts.forEach(function (p) {
        if (p.ed !== key) return;
        if (ql && !nameHit && plain(p.t).toLowerCase().indexOf(ql) < 0 && (p.why || '').toLowerCase().indexOf(ql) < 0) return;
        out.push({ k: k, p: p });
      });
    });
    out.sort(function (a, b) { return heat(b.p) - heat(a.p); });
    return out;
  }
  function fixClamp(feed) {  // 没有真的被截断的，就不显示「展开全文」
    feed.querySelectorAll('.tt.clamp:not([data-ck])').forEach(function (t) {
      t.setAttribute('data-ck', 1);
      if (t.scrollHeight <= t.clientHeight + 2) { t.classList.remove('clamp'); var mo = t.nextElementSibling; if (mo && mo.classList.contains('more')) mo.hidden = true; }
    });
  }
  var layout = setupCols(function (n) {
    var feed = document.getElementById('feed');
    if (!K) { showSkeleton('x'); return; }
    var rs = rows();
    if (!rs.length) { feed.classList.remove('loading'); feed.innerHTML = '<div class="empty">' + (q ? '没有找到相关博主或帖子' : '这一期还没有精选帖子') + '</div>'; document.getElementById('more').hidden = true; return; }
    pagedMasonry(feed, rs.map(function (r, i) { return postHtml(r.k, r.p, i % 12, false); }), n, { kind: 'x', batch: n === 1 ? 6 : n * 4, after: fixClamp });
  });
  function render() {
    var e = ed(cur.date, cur.kind)[0], want = e && e.id;
    document.getElementById('title').innerHTML = esc(md(cur.date)) + ' <span>' + (cur.kind === 'night' ? '夜间版' : '白天版') + '</span>';
    document.getElementById('range').textContent = e ? '北京时间 ' + e.start + ' – ' + e.end + ' · ' + wk(cur.date) + ' · 博主精选' : '';
    renderTimeline(dates.map(function (x) {
      var eds = ed(x);
      return { date: x, on: x === cur.date, subs: [['night', '🌙 夜间版'], ['day', '☀️ 白天版']].map(function (k) {
        return { key: k[0], label: k[1], on: x === cur.date && k[0] === cur.kind, disabled: !eds.some(function (y) { return y.kind === k[0]; }) };
      }) };
    }), function (date, key) {
      cur.date = date; if (key) cur.kind = key;
      if (!ed(cur.date, cur.kind).length) { var l = ed(cur.date); cur.kind = l[l.length - 1].kind; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      render();
    });
    document.title = '今日AI速报 · KOL · ' + md(cur.date) + (cur.kind === 'night' ? '夜间版' : '白天版');
    // 最新一期不带查询参数，打开域名就直接看最新；往期才写 ?date=&ed=
    var latestDate = dates[0], latestKind = (ed(latestDate).slice(-1)[0] || {}).kind;
    if (cur.date === latestDate && cur.kind === latestKind) setQs({ date: '', ed: '' });
    else setQs({ date: cur.date, ed: cur.kind });
    K = e ? AIT.data.k[e.id] : [];
    if (!K && e) {
      layout(true);  // 骨架屏
      AIT.load('k', e.id, function (o) { var now = ed(cur.date, cur.kind)[0]; if (!now || now.id !== want) return; K = o || []; layout(true); });
      return;
    }
    layout(true);
  }
  function findPost(pid) {
    if (!pid) return null;
    var hit = null, author = null;
    function scan(list) {
      (list || []).forEach(function (x) {
        x.posts.forEach(function (p) { if (p.id === pid) { hit = p; author = x; } });
      });
    }
    scan(K);
    if (!hit) Object.keys(AIT.data.k || {}).forEach(function (id) { scan(AIT.data.k[id]); });
    return hit && author ? { id: hit.id, u: hit.u, t: hit.t, tz: hit.tz, ts: hit.ts, m: hit.m, pm: hit.pm, a: { n: author.n, h: author.h, av: author.av } } : { id: pid };
  }
  function open(h) {
    var m = document.getElementById('modal'), mb = document.getElementById('mb');
    m.hidden = false; document.documentElement.classList.add('lock');
    requestAnimationFrame(function () { m.classList.add('show'); });
    mb.innerHTML = '<div class="sk-modal">' + skelCard('x', 0) + skelCard('x', 1) + '</div>'; mb.scrollTop = 0;
    var me = (K || []).filter(function (x) { return x.h.toLowerCase() === String(h).toLowerCase(); })[0];
    document.getElementById('mh').innerHTML = me ? av(me, 'av') + '<div><b>' + esc(me.n) + '</b><em>@' + esc(me.h) + ' · 加载中…</em></div><button class="x" aria-label="关闭">×</button>' : '<div></div><button class="x" aria-label="关闭">×</button>';
    // 这位博主所有期的精选：把各期数据都加载进来（已加载的直接用缓存）
    AIT.loadAll('k', EDS.map(function (e) { return e.id; }), function (all) {
      if (m.hidden) return;
      var k = null, posts = [];
      Object.keys(all).forEach(function (id) {
        (all[id] || []).forEach(function (x) { if (x.h.toLowerCase() === String(h).toLowerCase()) { k = k || x; posts = posts.concat(x.posts); } });
      });
      if (!k) { mb.innerHTML = '<div class="empty">没有找到这位博主</div>'; return; }
      posts.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
      document.getElementById('mh').innerHTML = av(k, 'av') + '<div><b>' + esc(k.n) + '</b><em>@' + esc(k.h) + ' · 精选 ' + posts.length + ' 条</em></div>' +
        '<button class="x" aria-label="关闭">×</button>';
      mb.innerHTML = posts.map(function (p, i) { return postHtml(k, p, i, true); }).join('');
      wirePics(m);
    });
  }
  function close() { var m = document.getElementById('modal'); m.classList.remove('show'); if (!TWM || TWM.m.hidden) document.documentElement.classList.remove('lock'); setTimeout(function () { m.hidden = true; }, 160); }
  document.getElementById('feed').addEventListener('click', function (e) {
    var m = e.target.closest('button.more');
    if (m) { var t = m.previousElementSibling, c = t.classList.toggle('clamp'); m.textContent = c ? '展开全文' : '收起'; return; }
    var op = e.target.closest('button.op');
    if (op) { openTweetViewer(findPost(op.closest('article.tw') && op.closest('article.tw').dataset.pid)); return; }
    var b = e.target.closest('button[data-h]'); if (b) open(b.dataset.h);
  });
  var qt; document.getElementById('q').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { q = e.target.value.trim(); if (K) layout(true); }, 150); });
  document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target.id === 'modal' || e.target.closest('.x')) { close(); return; }
    var op = e.target.closest('button.op');
    if (op) { openTweetViewer(findPost(op.closest('article.tw') && op.closest('article.tw').dataset.pid)); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  render();
  if (qs('open')) open(qs('open'));
})();
