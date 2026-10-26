/* 主题跟随北京时间：06:00–18:00 亮色，其余暗色。每分钟检查一次。?theme=light|dark 可临时指定。 */
(function () {
  var force = (location.search.match(/[?&]theme=(light|dark)/) || [])[1];
  function bjHour() { var d = new Date(); return (d.getUTCHours() + 8) % 24; }
  function apply() {
    var h = bjHour();
    var t = force || (h >= 6 && h < 18 ? 'light' : 'dark');
    if (document.documentElement.getAttribute('data-theme') !== t) document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#ffffff' : '#000000'; // 手机浏览器地址栏颜色跟顶栏一致
  }
  apply();
  setInterval(apply, 60000);
  document.addEventListener('visibilitychange', apply);
})();
/* 首屏前先定好列数（骨架屏和版心宽度就不会跳） */
(function () {
  try {
    var m = location.search.match(/[?&]cols=([123])/), w = +(m ? m[1] : localStorage.getItem('aitoday.cols')) || 1, vw = window.innerWidth;
    if ([1, 2, 3].indexOf(w) < 0) w = 1;
    document.documentElement.setAttribute('data-cols', vw < 700 ? 1 : (vw < 1100 ? Math.min(w, 2) : w));
  } catch (e) { document.documentElement.setAttribute('data-cols', 1); }
})();
