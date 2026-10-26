/* 在线访客头像（类似飞书文档右上角）
 * - 头像：本地 SVG 按随机 id 确定性生成，不调第三方图片接口
 * - 实时：公共 MQTT broker（WSS），无后端、无密钥；每 20s 心跳，60s 未见即视为离开
 * - 不收集任何个人信息：只广播随机 id + 当前在看哪一页
 * - 连接失败 / file:// 下静默隐藏，不影响页面
 */
(function () {
  if (location.protocol === 'file:' || !window.WebSocket || !document.querySelector) return;
  // 同时连两个公共 broker，结果合并去重：任何一个能连上就能看到彼此（有的网络只放行 443 端口）
  var BROKERS = [
    { url: 'wss://broker.emqx.io:8084/mqtt' },
    { url: 'wss://public.cloud.shiftr.io', username: 'public', password: 'public' } // shiftr 公共实例的公开账号，非密钥
  ];
  var ROOT = 'ai-today.sunth.cn/presence/v1/';
  var BEAT = 20000, TTL = 65000;
  var PAGE = /kol\.html/.test(location.pathname) ? 'kol' : 'index';
  var PAGE_NAME = { index: '速报', kol: 'KOL' };

  var ADJ = ['偶遇的', '发呆的', '摸鱼的', '认真的', '打盹的', '好奇的', '路过的', '快乐的', '安静的', '熬夜的', '元气的', '害羞的', '勇敢的', '慢吞吞的', '爱学习的', '刚睡醒的'];
  var NOUN = ['水母', '柴犬', '企鹅', '海獭', '橘猫', '仓鼠', '考拉', '树懒', '海豹', '小熊猫', '刺猬', '兔子', '鲸鱼', '水豚', '狐狸', '小鹿'];
  var COLORS = [['#ffd6e0', '#ff7aa2'], ['#d6f5ff', '#39b8e6'], ['#e3dcff', '#8b6cf0'], ['#d9f7e3', '#34c27a'], ['#fff1c9', '#f2a516'],
    ['#ffe0cc', '#ff8a4c'], ['#dfe7ff', '#5b7cfa'], ['#f3dcff', '#c065e8'], ['#d4f4ef', '#1fb5a0'], ['#ffdcdc', '#f05a5a']];

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var x = hash(seed) || 1; return function (n) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) % n; }; }
  function nick(id) { var r = rng('n' + id); return ADJ[r(ADJ.length)] + NOUN[r(NOUN.length)]; }
  function avatar(id) {
    var r = rng('a' + id), c = COLORS[r(COLORS.length)], bg = c[0], fg = c[1];
    var ears = ['', // 无
      '<circle cx="11" cy="11" r="6" fill="' + fg + '"/><circle cx="37" cy="11" r="6" fill="' + fg + '"/>', // 圆耳
      '<path d="M7 18 L10 4 L19 12Z M41 18 L38 4 L29 12Z" fill="' + fg + '"/>', // 尖耳
      '<ellipse cx="17" cy="6" rx="3.4" ry="8" fill="' + fg + '"/><ellipse cx="31" cy="6" rx="3.4" ry="8" fill="' + fg + '"/>'][r(4)]; // 兔耳
    var ey = 22 + r(3), gap = 7 + r(2);
    var eyes = [
      '<circle cx="' + (24 - gap) + '" cy="' + ey + '" r="2.4" fill="#1d1d24"/><circle cx="' + (24 + gap) + '" cy="' + ey + '" r="2.4" fill="#1d1d24"/>',
      '<path d="M' + (21 - gap) + ' ' + ey + ' q3 -3 6 0 M' + (21 + gap) + ' ' + ey + ' q3 -3 6 0" stroke="#1d1d24" stroke-width="2" fill="none" stroke-linecap="round"/>',
      '<circle cx="' + (24 - gap) + '" cy="' + ey + '" r="3" fill="#1d1d24"/><circle cx="' + (25 - gap) + '" cy="' + (ey - 1) + '" r="1" fill="#fff"/><circle cx="' + (24 + gap) + '" cy="' + ey + '" r="3" fill="#1d1d24"/><circle cx="' + (25 + gap) + '" cy="' + (ey - 1) + '" r="1" fill="#fff"/>'][r(3)];
    var my = ey + 7;
    var mouth = [
      '<path d="M20 ' + my + ' q4 4 8 0" stroke="#1d1d24" stroke-width="2" fill="none" stroke-linecap="round"/>',
      '<path d="M19 ' + my + ' q2.5 3 5 0 q2.5 3 5 0" stroke="#1d1d24" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
      '<ellipse cx="24" cy="' + (my + 1) + '" rx="2.6" ry="2" fill="#1d1d24"/>'][r(3)];
    var blush = r(3) ? '<ellipse cx="' + (24 - gap - 4) + '" cy="' + (ey + 5) + '" rx="3" ry="1.8" fill="' + fg + '" opacity=".45"/><ellipse cx="' + (24 + gap + 4) + '" cy="' + (ey + 5) + '" rx="3" ry="1.8" fill="' + fg + '" opacity=".45"/>' : '';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="' + bg + '"/><g transform="translate(24 27) scale(.8) translate(-24 -26)">' + ears +
      '<circle cx="24" cy="26" r="18" fill="#fff" stroke="' + fg + '" stroke-width="2.5"/>' + eyes + blush + mouth + '</g></svg>';
  }
  window.AITPresence = { avatar: avatar, nick: nick };

  var vid;
  try { vid = localStorage.getItem('aitoday.vid'); if (!/^[a-z0-9]{10}$/.test(vid || '')) { vid = Math.random().toString(36).slice(2, 12).padEnd(10, '0'); localStorage.setItem('aitoday.vid', vid); } }
  catch (e) { vid = Math.random().toString(36).slice(2, 12).padEnd(10, '0'); }
  var sid = vid + '-' + Math.random().toString(36).slice(2, 8); // 每个标签页一条连接
  var me = ROOT + sid;
  var peers = {}; // sid -> {v,p,seen}
  var box = null, clients = [], beatT = 0, gcT = 0, alive = false;

  function mount() {
    if (box) return box;
    var bar = document.querySelector('.top .in'), nav = bar && bar.querySelector('nav');
    if (!bar) return null;
    box = document.createElement('div');
    box.className = 'pres'; box.hidden = true; box.setAttribute('aria-label', '在线访客');
    bar.insertBefore(box, nav);
    return box;
  }
  function render() {
    var now = Date.now(), byV = {};
    Object.keys(peers).forEach(function (k) {
      var x = peers[k]; if (now - x.seen > TTL) { delete peers[k]; return; }
      if (!byV[x.v] || byV[x.v].seen < x.seen) byV[x.v] = x; // 同一浏览器多标签只算一人
    });
    byV[vid] = { v: vid, p: PAGE, seen: now + 1 };
    var list = Object.keys(byV).map(function (k) { return byV[k]; })
      .sort(function (a, b) { return a.v === vid ? -1 : b.v === vid ? 1 : b.seen - a.seen; });
    var b = mount(); if (!b) return;
    var max = window.innerWidth < 600 ? 2 : 4, show = list.slice(0, max), more = list.length - show.length;
    var html = '<span class="pres-av">' + show.map(function (x) {
      var tip = nick(x.v) + (x.v === vid ? '（你）' : '') + ' · 在看' + PAGE_NAME[x.p];
      return '<i data-tip="' + tip + '" aria-label="' + tip + '">' + avatar(x.v) + '</i>';
    }).join('') + (more > 0 ? '<i class="more" data-tip="还有 ' + more + ' 位访客">+' + more + '</i>' : '') + '</span>' +
      '<span class="pres-n"><b></b>' + list.length + ' 人在看</span>';
    if (html !== b._h) { b._h = html; b.innerHTML = html; } // 没变化就不动 DOM
    b.hidden = false;
  }
  function payload() { return JSON.stringify({ v: vid, p: PAGE, t: Date.now() }); }
  function beat() { clients.forEach(function (c) { if (c && c.connected) c.publish(me, payload(), { qos: 0, retain: true }); }); }
  function onMsg(topic, buf, pkt) {
    var k = topic.slice(ROOT.length); if (k === sid || !/^[a-z0-9]{10}-[a-z0-9]{1,8}$/.test(k)) return;
    var s = buf && buf.toString(); if (!s) { delete peers[k]; render(); return; } // 空保留消息 = 离开
    try { var d = JSON.parse(s); } catch (e) { return; }
    if (!d || !/^[a-z0-9]{10}$/.test(d.v) || !PAGE_NAME[d.p]) return;
    // 保留消息可能是很久以前留下的：按它自带的时间判断是否过期
    if (pkt && pkt.retain && Math.abs(Date.now() - (+d.t || 0)) > TTL) return;
    if (Object.keys(peers).length > 200 && !peers[k]) return;
    peers[k] = { v: d.v, p: d.p, seen: Date.now() };
    render();
  }
  function anyUp() { return clients.some(function (c) { return c && c.connected; }); }
  function bye() {
    alive = false; clearInterval(beatT); clearInterval(gcT);
    clients.forEach(function (c) { try { if (c.connected) { c.publish(me, '', { qos: 0, retain: true }); c.end(false); } else c.end(true); } catch (e) {} });
    clients = [];
  }
  function connectOne(i) {
    var cfg = BROKERS[i];
    var c = window.mqtt.connect(cfg.url, {
      clientId: 'ait_' + sid, username: cfg.username, password: cfg.password,
      clean: true, keepalive: 30, reconnectPeriod: 20000, connectTimeout: 10000,
      will: { topic: me, payload: '', qos: 0, retain: true } // 异常断开时 broker 替我们清掉保留消息
    });
    c.on('connect', function () {
      c.subscribe(ROOT + '+', { qos: 0 });
      c.publish(me, payload(), { qos: 0, retain: true });
      render();
    });
    c.on('message', onMsg);
    c.on('error', function () {});
    c.on('close', function () { setTimeout(function () { if (box && !anyUp()) box.hidden = true; }, 0); }); // 全部断开就静默隐藏
    clients[i] = c;
  }
  function connect() {
    if (alive || !window.mqtt) return;
    alive = true;
    for (var i = 0; i < BROKERS.length; i++) { try { connectOne(i); } catch (e) {} }
    clearInterval(beatT); beatT = setInterval(beat, BEAT);
    clearInterval(gcT); gcT = setInterval(function () { if (anyUp()) render(); }, 5000);
  }
  function load() {
    if (window.mqtt) return connect();
    var s = document.createElement('script');
    var cur = document.querySelector('script[src*="presence.js"]'), v = cur && (cur.getAttribute('src').match(/\?v=\w+/) || [''])[0];
    s.src = 'vendor-mqtt.min.js' + (v || ''); s.async = true; s.onload = connect; s.onerror = function () {};
    document.head.appendChild(s);
  }
  function start() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(load, { timeout: 3000 }); }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  window.addEventListener('pagehide', bye);
  window.addEventListener('pageshow', function (e) { if (e.persisted) load(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (box && !box.hidden) render(); }, 200); });
})();
