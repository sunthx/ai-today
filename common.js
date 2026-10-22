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
