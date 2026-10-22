(function () {
  var D = window.DIGESTS || [];
  var dates = []; D.forEach(function (d) { if (dates.indexOf(d.date) < 0) dates.push(d.date); });
  dates.sort().reverse();
  function find(date, kind) { return D.filter(function (d) { return d.date === date && (kind === undefined || d.kind === kind); }); }
  var cur = { date: qs('date'), kind: qs('ed') };
  if (!find(cur.date).length) cur.date = dates[0];
  if (!cur.kind || !find(cur.date, cur.kind).length) { var l = find(cur.date); cur.kind = l.length ? l[l.length - 1].kind : 'day'; }

  function hm(iso) { return iso ? iso.slice(5, 10).replace('-', '/') + ' ' + iso.slice(11, 16) : ''; }
  function render() {
    var d = find(cur.date, cur.kind)[0];
    var eds = find(cur.date);
    document.getElementById('title').innerHTML = esc(md(cur.date)) + ' <span>' + (cur.kind === 'night' ? '夜间版' : '白天版') + '</span>';
    document.getElementById('range').textContent = d && d.start ? '北京时间 ' + hm(d.start) + ' – ' + hm(d.end) + ' · ' + wk(cur.date) : '';
    document.getElementById('seg').innerHTML = [['night', '🌙 夜间版'], ['day', '☀️ 白天版']].map(function (k) {
      var has = eds.some(function (e) { return e.kind === k[0]; });
      return '<button role="tab" data-k="' + k[0] + '"' + (k[0] === cur.kind ? ' class="on"' : '') + (has ? '' : ' disabled') + '>' + k[1] + '</button>';
    }).join('');
    document.getElementById('dates').innerHTML = dates.map(function (x) {
      return '<button data-d="' + x + '"' + (x === cur.date ? ' class="on"' : '') + '><b>' + short(x) + '</b><small>' + wk(x) + '</small></button>';
    }).join('');
    var feed = document.getElementById('feed');
    feed.innerHTML = d ? d.items.map(function (it, i) {
      var who = it.a ? '<span class="who">' + esc(it.a.n) + ' <em>@' + esc(it.a.h) + '</em></span>' : '<span class="who"></span>';
      return '<li class="card" style="--i:' + i + '">' +
        '<div class="k"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="e">' + esc(it.e) + '</span></div>' +
        '<h2>' + esc(it.h) + '</h2>' +
        '<p>' + esc(it.d || it.t) + '</p>' +
        (it.img ? '<figure><img loading="lazy" src="' + esc(it.img) + '" alt=""></figure>' : '') +
        '<div class="src">' + who + (it.u ? '<a href="' + esc(it.u) + '" target="_blank" rel="noopener">查看原帖 ↗</a>' : '') + '</div>' +
        '</li>';
    }).join('') : '<li class="empty">这一期还没有内容</li>';
    document.getElementById('extra').textContent = d && d.extra ? d.extra : '';
    document.title = '今日AI速报 · ' + md(cur.date) + (cur.kind === 'night' ? '夜间版' : '白天版');
    setQs({ date: cur.date, ed: cur.kind });
    var on = document.querySelector('#dates .on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  document.getElementById('seg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return; cur.kind = b.dataset.k; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('dates').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; cur.date = b.dataset.d;
    if (!find(cur.date, cur.kind).length) { var l = find(cur.date); cur.kind = l[l.length - 1].kind; }
    render();
  });
  document.getElementById('feed').addEventListener('click', function (e) {
    var img = e.target.closest('figure img'); if (img) window.open(img.getAttribute('src'), '_blank');
  });
  document.getElementById('foot').textContent = '今日AI速报 · 每天 09:00 / 18:00（北京时间）更新' + (window.BUILD_INFO ? ' · 数据 ' + window.BUILD_INFO.built : '');
  render();
})();
