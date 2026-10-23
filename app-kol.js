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
  var ICON = {
    r: '<svg viewBox="0 0 24 24"><path d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.47 0 8.13 3.62 8.13 8.1 0 2.95-1.6 5.66-4.18 7.08L10 21.5v-3.75h-.25c-4.42 0-8-3.58-8-7.75zm8-6c-3.31 0-6 2.690-6 6 0 3.36 2.73 5.75 6.07 5.75H12v2.4l5.12-2.830c1.95-1.07 3.13-3.1 3.13-5.32 0-3.37-2.75-6-6.13-6H9.75z"/></svg>',
    rt: '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.43 4.14-1.37 1.46L5.5 7.55V16c0 1.1.9 2 2 2H13v2H7.5c-2.21 0-4-1.79-4-4V7.55L1.44 9.48.07 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.21 0 4 1.79 4 4v8.45l2.06-1.93 1.37 1.46-4.43 4.14-4.43-4.14 1.37-1.46 2.06 1.93V8c0-1.1-.9-2-2-2z"/></svg>',
    l: '<svg viewBox="0 0 24 24"><path d="M16.7 3.5c-1.98 0-3.6 1.04-4.7 2.62C10.9 4.540 9.28 3.5 7.3 3.5 4.34 3.5 2 5.93 2 9.03c0 5.31 6.46 9.73 9.5 11.47.31.18.69.18 1 0C15.54 18.76 22 14.34 22 9.03 22 5.93 19.66 3.5 16.7 3.5zm-4.7 15c-3.27-1.98-8-5.66-8-9.47C4 7.04 5.47 5.5 7.3 5.5c1.64 0 2.94 1.14 3.75 2.86h1.9C13.76 6.64 15.06 5.5 16.7 5.5c1.83 0 3.3 1.54 3.3 3.53 0 3.81-4.73 7.49-8 9.470z"/></svg>',
    v: '<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>'
  };
  function num(n) { n = +n || 0; if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿'; if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万'; return n ? String(n) : ''; }
  function rich(t) {
    return esc(t).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (_, u, d) { return '<a href="' + u + '" target="_blank" rel="noopener">' + d + '</a>'; })
      .replace(/(^|[^\w@])@(\w{1,15})/g, '$1<span class="at">@$2</span>')
      .replace(/(^|\s)#([^\s#]+)/g, '$1<span class="at">#$2</span>');
  }
  function plain(t) { return t.replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1'); }
  function av(k, cls) { return k.av ? pic(k.av, 1, cls, true) : '<span class="' + cls + ' ph">' + esc(k.n.slice(0, 1)) + '</span>'; }
  function hmTs(ts) { return ts.slice(5, 10).replace('-', '/') + ' ' + ts.slice(11, 16); }
  function heat(p) { return p.pm[2] + 2 * p.pm[1] + p.pm[0]; }
  function grid(m, url) {
    if (!m.length) return '';
    var one = m.length === 1, r = one && m[0].w && m[0].h ? Math.min(2, Math.max(0.8, m[0].w / m[0].h)) : 0;
    return '<div class="media n' + Math.min(m.length, 4) + '">' + m.slice(0, 4).map(function (x) {
      // 卡片里只用 webp 小图；点图片看原图，视频只放封面，点了去 X 播放
      return '<a class="mi' + (x.type !== 'photo' ? ' vid' : '') + '" href="' + esc(x.type !== 'photo' ? url : x.src) + '" target="_blank" rel="noopener">' + pic(x.t || x.src, one ? (r || 1.6) : 0) + '</a>';
    }).join('') + '</div>';
  }
  function edLabel(key) { var e = EDS.filter(function (x) { return x.key === key; })[0]; return e ? md(e.date) + (e.kind === 'night' ? ' 夜间' : ' 白天') : ''; }
  // 一条帖子（X 样式）。inModal 时显示所属期次
  function postHtml(k, p, i, inModal) {
    return '<article class="tw' + (inModal ? '' : ' xcard') + '" style="--i:' + Math.min(i, 20) + '">' +
      '<button class="who-btn" data-h="' + esc(k.h) + '" aria-label="看 ' + esc(k.n) + ' 的精选">' + av(k, 'tav') + '</button><div class="tb">' +
      '<div class="th"><button class="nm" data-h="' + esc(k.h) + '"><b>' + esc(k.n) + '</b><span>@' + esc(k.h) + '</span></button><span class="dt">· ' + esc(hmTs(p.ts)) + '</span></div>' +
      (p.why ? '<div class="why">' + (inModal ? '<i>' + esc(edLabel(p.ed)) + '</i>' : '') + esc(p.why) + '</div>' : (inModal ? '<div class="why"><i>' + esc(edLabel(p.ed)) + '</i></div>' : '')) +
      (!inModal && plain(p.t).length > 260 ? '<div class="tt clamp">' + rich(p.t) + '</div><button class="more">展开全文</button>' : '<div class="tt">' + rich(p.t) + '</div>') + grid(p.m, p.u) +
      '<div class="ta"><span>' + ICON.r + num(p.pm[0]) + '</span><span>' + ICON.rt + num(p.pm[1]) + '</span><span>' + ICON.l + num(p.pm[2]) + '</span><span>' + ICON.v + num(p.pm[3]) + '</span>' +
      '<a href="' + esc(p.u) + '" target="_blank" rel="noopener">原帖 ↗</a></div>' +
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
      if (t.scrollHeight <= t.clientHeight + 2) { t.classList.remove('clamp'); if (t.nextElementSibling) t.nextElementSibling.remove(); }
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
  function open(h) {
    var m = document.getElementById('modal'), mb = document.getElementById('mb');
    m.hidden = false; document.body.classList.add('lock');
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
        '<a class="xlink" href="https://x.com/' + esc(k.h) + '" target="_blank" rel="noopener">主页 ↗</a><button class="x" aria-label="关闭">×</button>';
      mb.innerHTML = posts.map(function (p, i) { return postHtml(k, p, i, true); }).join('');
      wirePics(m);
    });
  }
  function close() { var m = document.getElementById('modal'); m.classList.remove('show'); document.body.classList.remove('lock'); setTimeout(function () { m.hidden = true; }, 200); }
  document.getElementById('feed').addEventListener('click', function (e) {
    var m = e.target.closest('button.more');
    if (m) { var t = m.previousElementSibling, c = t.classList.toggle('clamp'); m.textContent = c ? '展开全文' : '收起'; return; }
    var b = e.target.closest('button[data-h]'); if (b) open(b.dataset.h);
  });
  var qt; document.getElementById('q').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { q = e.target.value.trim(); if (K) layout(true); }, 150); });
  document.getElementById('modal').addEventListener('click', function (e) { if (e.target.id === 'modal' || e.target.closest('.x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  render();
  if (qs('open')) open(qs('open'));
})();
