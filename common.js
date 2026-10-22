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
