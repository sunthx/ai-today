(function () {
  var K = window.KOLS || [], DAYS = (window.KOL_DAYS || []).slice().reverse();
  var cur = qs('date'); if (!DAYS.some(function (d) { return d.date === cur; })) cur = DAYS.length ? DAYS[0].date : '';
  var q = '';
  var ICON = {
    r: '<svg viewBox="0 0 24 24"><path d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.47 0 8.13 3.62 8.13 8.1 0 2.95-1.6 5.66-4.18 7.08L10 21.5v-3.75h-.25c-4.42 0-8-3.58-8-7.75zm8-6c-3.31 0-6 2.69-6 6 0 3.36 2.73 5.75 6.07 5.75H12v2.4l5.12-2.83c1.95-1.07 3.13-3.1 3.13-5.32 0-3.37-2.75-6-6.13-6H9.75z"/></svg>',
    rt: '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.43 4.14-1.37 1.46L5.5 7.55V16c0 1.1.9 2 2 2H13v2H7.5c-2.21 0-4-1.79-4-4V7.55L1.44 9.48.07 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.21 0 4 1.79 4 4v8.45l2.06-1.93 1.37 1.46-4.43 4.14-4.43-4.14 1.37-1.46 2.06 1.93V8c0-1.1-.9-2-2-2z"/></svg>',
    l: '<svg viewBox="0 0 24 24"><path d="M16.7 3.5c-1.98 0-3.6 1.04-4.7 2.62C10.9 4.54 9.28 3.5 7.3 3.5 4.34 3.5 2 5.93 2 9.03c0 5.31 6.46 9.73 9.5 11.47.31.18.69.18 1 0C15.54 18.76 22 14.34 22 9.03 22 5.93 19.66 3.5 16.7 3.5zm-4.7 15c-3.27-1.98-8-5.66-8-9.47C4 7.04 5.47 5.5 7.3 5.5c1.64 0 2.94 1.14 3.75 2.86h1.9C13.76 6.64 15.06 5.5 16.7 5.5c1.83 0 3.3 1.54 3.3 3.53 0 3.81-4.73 7.49-8 9.47z"/></svg>',
    v: '<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>'
  };
  function num(n) { n = +n || 0; if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿'; if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万'; return n ? String(n) : ''; }
  function rich(t) {
    return esc(t).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (_, u, d) { return '<a href="' + u + '" target="_blank" rel="noopener">' + d + '</a>'; })
      .replace(/(^|[^\w@])@(\w{1,15})/g, '$1<span class="at">@$2</span>')
      .replace(/(^|\s)#([^\s#]+)/g, '$1<span class="at">#$2</span>');
  }
  function plain(t) { return t.replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1'); }
  function av(k, cls) { return k.av ? '<img class="' + cls + '" src="' + esc(k.av) + '" alt="">' : '<span class="' + cls + ' ph">' + esc(k.n.slice(0, 1)) + '</span>'; }
  function postsOf(k) { return k.posts.filter(function (p) { return p.day === cur; }); }
  function render() {
    var day = DAYS.filter(function (d) { return d.date === cur; })[0];
    document.getElementById('title').innerHTML = esc(md(cur)) + ' <span>博主动态</span>';
    document.getElementById('range').textContent = day ? '北京时间 ' + day.start + ' – ' + day.end + ' · ' + wk(cur) : '';
    document.getElementById('dates').innerHTML = DAYS.map(function (d) {
      return '<button data-d="' + d.date + '"' + (d.date === cur ? ' class="on"' : '') + '><b>' + short(d.date) + '</b><small>' + wk(d.date) + '</small></button>';
    }).join('');
    var ql = q.toLowerCase();
    var rows = K.map(function (k) { return { k: k, ps: postsOf(k) }; }).filter(function (r) {
      if (!r.ps.length) return false;
      if (!ql) return true;
      return (r.k.n + ' ' + r.k.h).toLowerCase().indexOf(ql) >= 0 || r.ps.some(function (p) { return p.t.toLowerCase().indexOf(ql) >= 0; });
    });
    rows.sort(function (a, b) { return b.ps.length - a.ps.length || (b.ps[0].ts > a.ps[0].ts ? 1 : -1); });
    document.getElementById('list').innerHTML = rows.length ? rows.map(function (r, i) {
      var first = plain(r.ps[0].t).split('\n').filter(Boolean)[0] || (r.ps[0].m.length ? '[图片]' : '');
      return '<li class="person" style="--i:' + Math.min(i, 20) + '"><button data-h="' + esc(r.k.h) + '">' + av(r.k, 'av') +
        '<span class="pi"><span class="pn">' + esc(r.k.n) + ' <em>@' + esc(r.k.h) + '</em></span><span class="pv">' + esc(first) + '</span></span>' +
        '<span class="pc">' + r.ps.length + ' 条</span></button></li>';
    }).join('') : '<li class="empty">' + (q ? '没有找到相关博主' : '这一天没有监听到帖子') + '</li>';
    setQs({ date: cur, theme: qs('theme') });
  }
  function grid(m) {
    if (!m.length) return '';
    return '<div class="media n' + Math.min(m.length, 4) + '">' + m.slice(0, 4).map(function (x) {
      return '<a class="mi' + (x.type !== 'photo' ? ' vid' : '') + '" href="' + esc(x.src) + '" target="_blank"><img loading="lazy" src="' + esc(x.src) + '" alt=""></a>';
    }).join('') + '</div>';
  }
  function open(h) {
    var k = K.filter(function (x) { return x.h === h; })[0]; if (!k) return;
    var ps = postsOf(k);
    document.getElementById('mh').innerHTML = av(k, 'av') + '<div><b>' + esc(k.n) + '</b><em>@' + esc(k.h) + ' · ' + esc(md(cur)) + ' 共 ' + ps.length + ' 条</em></div><button class="x" aria-label="关闭">×</button>';
    document.getElementById('mb').innerHTML = ps.map(function (p) {
      return '<article class="tw">' + av(k, 'tav') + '<div class="tb">' +
        '<div class="th"><b>' + esc(k.n) + '</b><span>@' + esc(k.h) + ' · ' + esc(p.ts.slice(5).replace('-', '/')) + '</span></div>' +
        '<div class="tt">' + rich(p.t) + '</div>' + grid(p.m) +
        '<div class="ta"><span>' + ICON.r + num(p.pm[0]) + '</span><span>' + ICON.rt + num(p.pm[1]) + '</span><span>' + ICON.l + num(p.pm[2]) + '</span><span>' + ICON.v + num(p.pm[3]) + '</span>' +
        '<a href="' + esc(p.u) + '" target="_blank" rel="noopener">在 X 打开</a></div>' +
        '</div></article>';
    }).join('');
    var m = document.getElementById('modal'); m.hidden = false; document.body.classList.add('lock');
    requestAnimationFrame(function () { m.classList.add('show'); });
    document.getElementById('mb').scrollTop = 0;
  }
  function close() { var m = document.getElementById('modal'); m.classList.remove('show'); document.body.classList.remove('lock'); setTimeout(function () { m.hidden = true; }, 200); }
  document.getElementById('list').addEventListener('click', function (e) { var b = e.target.closest('button[data-h]'); if (b) open(b.dataset.h); });
  document.getElementById('dates').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { cur = b.dataset.d; render(); } });
  document.getElementById('q').addEventListener('input', function (e) { q = e.target.value.trim(); render(); });
  document.getElementById('modal').addEventListener('click', function (e) { if (e.target.id === 'modal' || e.target.closest('.x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  render();
  if (qs('open')) open(qs('open'));
})();
