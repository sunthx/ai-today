(function () {
  var IDX = AIT.idx.d || [];
  var dates = []; IDX.forEach(function (d) { if (dates.indexOf(d.date) < 0) dates.push(d.date); });
  dates.sort().reverse();
  function find(date, kind) { return IDX.filter(function (d) { return d.date === date && (!kind || d.kind === kind); }); }
  var cur = { date: qs('date'), kind: qs('ed') };
  if (!find(cur.date).length) cur.date = dates[0];
  if (!cur.kind || !find(cur.date, cur.kind).length) { var l = find(cur.date); cur.kind = l.length ? l[l.length - 1].kind : 'day'; }
  var data = null;

  function hm(iso) { return iso ? iso.slice(5, 10).replace('-', '/') + ' ' + iso.slice(11, 16) : ''; }
  function cardHtml(it, i, n) {
    var who = it.a ? '<span class="who">' + esc(it.a.n) + ' <em>@' + esc(it.a.h) + '</em></span>' : '<span class="who"></span>';
    // 单列：按原图比例（最扁 2.4:1、最高 1.5:1，再高就裁）；多列统一 16:10。卡片里用 webp 小图，点开看原图
    var r = n > 1 ? 1.6 : Math.min(2.4, Math.max(1.5, it.r || 1.6));
    return '<article class="card" style="--i:' + (i % 12) + '">' +
      '<div class="k"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="e">' + esc(it.e) + '</span></div>' +
      '<h2>' + esc(it.h) + '</h2>' +
      '<p>' + esc(it.d || it.t) + '</p>' +
      (it.img ? '<figure data-full="' + esc(it.img) + '">' + pic(it.ti || it.img, r, '', i < n) + '</figure>' : '') +
      '<div class="src">' + who + (it.u ? '<a href="' + esc(it.u) + '" target="_blank" rel="noopener">查看原帖 ↗</a>' : '') + '</div></article>';
  }
  var layout = setupCols(function (n) {
    var feed = document.getElementById('feed');
    if (!data) { showSkeleton('card'); return; }
    if (!data.items || !data.items.length) { feed.classList.remove('loading'); feed.innerHTML = '<div class="empty">这一期还没有内容</div>'; document.getElementById('more').hidden = true; return; }
    pagedMasonry(feed, data.items.map(function (it, i) { return cardHtml(it, i, n); }), n, { kind: 'card', batch: n === 1 ? 5 : n * 3 });
  });
  function head() {
    var d = find(cur.date, cur.kind)[0];
    document.getElementById('title').innerHTML = esc(md(cur.date)) + ' <span>' + (cur.kind === 'night' ? '夜间版' : '白天版') + '</span>';
    document.getElementById('range').textContent = d && d.start ? '北京时间 ' + hm(d.start) + ' – ' + hm(d.end) + ' · ' + wk(cur.date) : '';
    renderTimeline(dates.map(function (x) {
      var eds = find(x);
      return { date: x, on: x === cur.date, subs: [['night', '🌙 夜间版'], ['day', '☀️ 白天版']].map(function (k) {
        return { key: k[0], label: k[1], on: x === cur.date && k[0] === cur.kind, disabled: !eds.some(function (e) { return e.kind === k[0]; }) };
      }) };
    }), function (date, key) {
      cur.date = date;
      if (key) cur.kind = key;
      if (!find(cur.date, cur.kind).length) { var l = find(cur.date); cur.kind = l[l.length - 1].kind; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      go();
    });
    document.title = '今日AI速报 · ' + md(cur.date) + (cur.kind === 'night' ? '夜间版' : '白天版');
    setQs({ date: cur.date, ed: cur.kind });
  }
  function go() {
    var d = find(cur.date, cur.kind)[0], want = d && d.id;
    head();
    data = d ? AIT.data.d[d.id] : null;
    document.getElementById('extra').textContent = '';
    if (!data && d) {
      layout(true);  // 骨架屏
      AIT.load('d', d.id, function (o) {
        var now = find(cur.date, cur.kind)[0]; if (!now || now.id !== want) return;  // 已经切到别的期
        data = o || { items: [] }; document.getElementById('extra').textContent = data.extra || ''; layout(true);
      });
      return;
    }
    document.getElementById('extra').textContent = data && data.extra ? data.extra : '';
    layout(true);
  }
  document.getElementById('feed').addEventListener('click', function (e) {
    var f = e.target.closest('figure[data-full]'); if (f && f.querySelector('.pic.ok')) window.open(f.dataset.full, '_blank');
  });
  document.getElementById('foot').textContent = '今日AI速报 · 每天 09:00 / 18:00（北京时间）更新' + (AIT.info ? ' · 数据 ' + AIT.info.built : '');
  go();
})();
