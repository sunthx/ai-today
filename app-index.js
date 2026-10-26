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
      '<div class="src">' + who + (it.u || it.post ? '<button type="button" class="op" data-i="' + i + '">查看原帖</button>' : '') + '</div></article>';
  }
  // 擂台：前三名（有 rank 字段就按 rank 排，否则按原顺序 = 热度排名）
  var MEDAL = [['gold', '🥇', '金牌'], ['silver', '🥈', '银牌'], ['bronze', '🥉', '铜牌']];
  function ranked(items) {
    var has = items.some(function (it) { return typeof it.rank === 'number'; });
    if (!has) return items;
    return items.map(function (it, i) { return { it: it, i: i }; }).sort(function (a, b) {
      var ra = typeof a.it.rank === 'number' ? a.it.rank : 1e9 + a.i, rb = typeof b.it.rank === 'number' ? b.it.rank : 1e9 + b.i; return ra - rb;
    }).map(function (x) { return x.it; });
  }
  function podCard(it, k, absI) {
    var m = MEDAL[k], who = it.a ? '<span class="who">' + esc(it.a.n) + ' <em>@' + esc(it.a.h) + '</em></span>' : '<span class="who"></span>';
    return '<div class="pd pd-' + m[0] + '"><article class="pd-card">' +
      '<div class="pd-medal"><span class="pd-badge">' + m[1] + ' ' + m[2] + '</span><span class="e">' + esc(it.e) + '</span></div>' +
      '<h2>' + esc(it.h) + '</h2>' +
      (it.img ? '<figure data-full="' + esc(it.img) + '">' + pic(it.ti || it.img, 1.6, '', true) + '</figure>' : '<figure class="noimg" aria-hidden="true"><span>' + esc(it.e || '✨') + '</span></figure>') +
      '<p>' + esc(it.d || it.t) + '</p>' +
      '<div class="src">' + who + (it.u || it.post ? '<button type="button" class="op" data-i="' + absI + '">查看原帖</button>' : '') + '</div>' +
      '</article><div class="pd-step" aria-hidden="true"><span>' + (k + 1) + '</span></div></div>';
  }
  function podSkel() {
    return '<div class="pd-title"><b>🏆 本期擂台</b><span>热度前三</span></div><div class="pd-row">' + ['gold', 'silver', 'bronze'].map(function (m, i) {
      return '<div class="pd pd-' + m + ' pd-sk"><div class="pd-card"><span class="sk sk-medal"></span><span class="sk sk-h"></span><span class="sk sk-h s"></span><span class="sk sk-img"></span><span class="sk sk-l"></span><span class="sk sk-l"></span><span class="sk sk-l s"></span><span class="sk sk-f"></span></div><div class="pd-step"><span>' + (i + 1) + '</span></div></div>';
    }).join('') + '</div>';
  }
  function drawPodium(items) {
    var box = document.getElementById('podium'), rh = document.getElementById('restH');
    if (!items) { box.hidden = false; box.className = 'podium loading'; box.innerHTML = podSkel(); rh.hidden = false; return; }
    var top = items.slice(0, 3);
    box.hidden = !top.length; rh.hidden = items.length <= 3;
    box.className = 'podium n' + top.length;
    box.innerHTML = '<div class="pd-title"><b>🏆 本期擂台</b><span>热度前三</span></div><div class="pd-row">' + top.map(function (it, k) { return podCard(it, k, k); }).join('') + '</div>';
    wirePics(box);
  }
  var layout = setupCols(function (n) {
    var feed = document.getElementById('feed');
    if (!data) { drawPodium(null); showSkeleton('card'); return; }
    var items = ranked(data.items || []);
    drawPodium(items);
    var rest = items.slice(3);
    if (!rest.length) { feed.classList.remove('loading'); feed.innerHTML = items.length ? '' : '<div class="empty">这一期还没有内容</div>'; document.getElementById('more').hidden = true; return; }
    pagedMasonry(feed, rest.map(function (it, i) { return cardHtml(it, i + 3, n); }), n, { kind: 'card', batch: n === 1 ? 5 : n * 3 });
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
    // 最新一期不带查询参数，打开域名就直接看最新；往期才写 ?date=&ed=
    var latestDate = dates[0], latestKind = (find(latestDate).slice(-1)[0] || {}).kind;
    if (cur.date === latestDate && cur.kind === latestKind) setQs({ date: '', ed: '' });
    else setQs({ date: cur.date, ed: cur.kind });
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
  function itemByI(i) {
    var items = ranked((data && data.items) || []);
    return items[+i];
  }
  ['feed', 'podium'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (e) {
      var op = e.target.closest('button.op');
      if (op) { e.preventDefault(); var it = itemByI(op.dataset.i); openTweetViewer(it && it.post, it && it.u); return; }
    });
  });
  document.getElementById('foot').textContent = '今日AI速报 · 每天 09:00 / 18:00（北京时间）更新' + (AIT.info ? ' · 数据 ' + AIT.info.built : '');
  go();
})();
