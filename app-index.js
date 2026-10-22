(function () {
  var D = window.DIGESTS || [];
  var dates = []; D.forEach(function (d) { if (dates.indexOf(d.date) < 0) dates.push(d.date); });
  dates.sort().reverse();
  function find(date, kind) { return D.filter(function (d) { return d.date === date && (kind === undefined || d.kind === kind); }); }
  var cur = { date: qs('date'), kind: qs('ed') };
  if (!find(cur.date).length) cur.date = dates[0];
  if (!cur.kind || !find(cur.date, cur.kind).length) { var l = find(cur.date); cur.kind = l.length ? l[l.length - 1].kind : 'day'; }
  var KEY = 'aitoday.cols';
  var want = +(qs('cols') || localStorage.getItem(KEY) || 1);
  if ([1, 2, 3].indexOf(want) < 0) want = 1;

  function hm(iso) { return iso ? iso.slice(5, 10).replace('-', '/') + ' ' + iso.slice(11, 16) : ''; }
  function effCols() { var w = window.innerWidth; return w < 700 ? 1 : (w < 1100 ? Math.min(want, 2) : want); }
  function cardHtml(it, i) {
    var who = it.a ? '<span class="who">' + esc(it.a.n) + ' <em>@' + esc(it.a.h) + '</em></span>' : '<span class="who"></span>';
    return '<article class="card" style="--i:' + i + '">' +
      '<div class="k"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="e">' + esc(it.e) + '</span></div>' +
      '<h2>' + esc(it.h) + '</h2>' +
      '<p>' + esc(it.d || it.t) + '</p>' +
      (it.img ? '<figure><img src="' + esc(it.img) + '" alt=""></figure>' : '') +
      '<div class="src">' + who + (it.u ? '<a href="' + esc(it.u) + '" target="_blank" rel="noopener">查看原帖 ↗</a>' : '') + '</div></article>';
  }
  var lastCols = 0;
  function layout(force) {
    var n = effCols();
    if (!force && n === lastCols) return;
    lastCols = n;
    var d = find(cur.date, cur.kind)[0], feed = document.getElementById('feed');
    document.getElementById('shell').className = 'shell c' + n; document.body.setAttribute('data-cols', n);
    document.querySelectorAll('#cols button').forEach(function (b) { b.classList.toggle('on', +b.dataset.c === want); b.setAttribute('aria-checked', +b.dataset.c === want); });
    if (!d) { feed.innerHTML = '<div class="empty">这一期还没有内容</div>'; return; }
    // 瀑布流：按顺序把卡片放进当前最矮的一列（阅读顺序仍是 1、2、3…从左到右）
    feed.innerHTML = Array(n + 1).join('<div class="col"></div>');
    var cols = feed.children;
    d.items.forEach(function (it, i) {
      var best = cols[0];
      for (var c = 1; c < cols.length; c++) if (cols[c].offsetHeight < best.offsetHeight - 4) best = cols[c];
      best.insertAdjacentHTML('beforeend', cardHtml(it, i));
    });
  }
  function render() {
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
      render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('extra').textContent = d && d.extra ? d.extra : '';
    document.title = '今日AI速报 · ' + md(cur.date) + (cur.kind === 'night' ? '夜间版' : '白天版');
    setQs({ date: cur.date, ed: cur.kind });
    layout(true);
  }
  document.getElementById('cols').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    want = +b.dataset.c; try { localStorage.setItem(KEY, want); } catch (x) {}
    setQs({ cols: '' }); layout(true);
  });
  document.getElementById('feed').addEventListener('click', function (e) {
    var img = e.target.closest('figure img'); if (img) window.open(img.getAttribute('src'), '_blank');
  });
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { layout(false); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (lastCols > 1) layout(true); });
  document.getElementById('foot').textContent = '今日AI速报 · 每天 09:00 / 18:00（北京时间）更新' + (window.BUILD_INFO ? ' · 数据 ' + window.BUILD_INFO.built : '');
  render();
})();
