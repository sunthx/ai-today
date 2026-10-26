/* 顶栏 Grok Bot 小动画：眨眼、天线摆动、偶尔换表情、眼睛跟鼠标、戳一下换表情 + 小粒子、偶尔冒一句话。
   性能：只用 transform/opacity 的一次性动画（Web Animations），没有常驻的无限动画；
   空闲动作靠 4–8 秒一次的定时器触发，标签页隐藏 / 顶栏不在视野 / 正在滚动时暂停；系统开了「减少动态效果」就不做空闲动画。 */
(function () {
  var F = window.BOT_FACES, P = window.BOT_PARTS, wrap = document.getElementById('botW');
  if (!F || !P || !wrap || !wrap.animate) return;
  var KEYS = Object.keys(F), NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = ((window.BOT_FACE || '').match(/faces\/(\w+)\.svg/) || [])[1];
  if (!F[cur]) cur = 'happy';

  // 把首屏的 <img> 换成同一张脸的内联 SVG（外观一样，但五官可以单独动）
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64'); svg.setAttribute('class', 'bot'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<g class="ant">' + P.ant + '<circle class="tip" cx="32" cy="5.6" r="4" stroke="' + P.ink + '" stroke-width="2.2"/></g>' + P.head +
    '<g class="ft"><g class="lk"><g class="ey"></g></g><g class="mo"></g><g class="ex"></g></g>';
  var q = function (s) { return svg.querySelector(s); };
  var tip = q('.tip'), ft = q('.ft'), lk = q('.lk'), ey = q('.ey'), mo = q('.mo'), ex = q('.ex');
  function paint(k) { var f = F[k]; cur = k; tip.setAttribute('fill', f.t); ey.innerHTML = f.e; mo.innerHTML = f.m; ex.innerHTML = f.x; wrap.setAttribute('aria-label', '戳一下 Grok Bot（现在：' + f.n + '）'); }
  paint(cur);
  var img = wrap.querySelector('img'); if (img) wrap.replaceChild(svg, img); else wrap.appendChild(svg);

  var busy = false, lastScroll = 0, inView = true, timer = 0, said = 0;
  var E = 'cubic-bezier(.3,1.6,.5,1)';
  function anim(el, kf, ms, ease) { return el.animate(kf, { duration: ms, easing: ease || 'ease-out' }); }
  function done(a, fn) { a.onfinish = fn; a.oncancel = fn; }

  function blink(twice) {
    if (cur === 'cool') return wiggle(); // 戴墨镜不眨眼，摆天线
    var kf = [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', offset: .45 }, { transform: 'scaleY(1)' }];
    var a = anim(ey, kf, 170, 'ease-in-out');
    if (twice) done(a, function () { setTimeout(function () { anim(ey, kf, 170, 'ease-in-out'); }, 90); });
  }
  function wiggle() {
    anim(q('.ant'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0)' }], 700, 'ease-in-out');
  }
  function hop() { anim(svg, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-3px) scale(1.06,.96)', offset: .35 }, { transform: 'translateY(0) scale(1)' }], 380, E); }
  function glance() {
    if (mouse) return blink();
    var dx = Math.random() < .5 ? -2.5 : 2.5;
    var a = anim(lk, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + dx + 'px,-.5px)', offset: .2 }, { transform: 'translate(' + dx + 'px,-.5px)', offset: .8 }, { transform: 'translate(0,0)' }], 1300, 'ease-in-out');
  }
  // 换表情：五官缩没 → 换 → 弹回来，脑袋顺便跳一下
  function morph(k, cb) {
    if (busy) return; busy = true;
    if (!k) { do { k = KEYS[Math.random() * KEYS.length | 0]; } while (k === cur); }
    if (reduce) { paint(k); busy = false; cb && cb(k); return; }
    var a = anim(ft, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], 120, 'ease-in');
    done(a, function () {
      paint(k);
      anim(ft, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], 300, E);
      hop(); if (Math.random() < .5) wiggle();
      setTimeout(function () { busy = false; }, 320);
      cb && cb(k);
    });
  }

  // 小粒子：按表情配（爱心 / zzz / 星光 / 问号 …）
  var HEART = '<svg viewBox="0 0 10 10"><path d="M5 9C1 6 0 4.4 0 3A2.6 2.6 0 0 1 5 1.8 2.6 2.6 0 0 1 10 3C10 4.4 9 6 5 9Z" fill="currentColor"/></svg>';
  var SPARK = '<svg viewBox="-5 -5 10 10"><path d="M0-5 1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z" fill="currentColor"/></svg>';
  var FX = { love: [HEART, '#ff5c8a'], blush: [HEART, '#ff5c8a'], tongue: [HEART, '#ff5c8a'], cat: ['喵', '#ff5c8a'],
    sleepy: ['z', '#7cc4ff'], think: ['?', '#ffc83d'], wow: ['!', '#7cc4ff'], laugh: ['哈', '#ffc83d'], dizzy: [SPARK, '#7cc4ff'],
    stars: [SPARK, '#ffc83d'], sparkle: [SPARK, '#7cc4ff'], wink: [SPARK, '#ffc83d'], cool: [SPARK, ''], happy: [SPARK, '#ffc83d'] };
  function burst(k) {
    if (reduce) return;
    var fx = FX[k] || FX.happy, n = 4 + (Math.random() * 2 | 0);
    for (var i = 0; i < n; i++) (function (i) {
      var s = document.createElement('i'); s.className = 'bp' + (fx[0].charAt(0) === '<' ? '' : ' tx'); s.innerHTML = fx[0];
      if (fx[1]) s.style.color = fx[1];
      wrap.appendChild(s);
      var ang = (-70 + i * (140 / (n - 1)) + (Math.random() * 16 - 8)) * Math.PI / 180, r = 22 + Math.random() * 10; // 往右半边散开，别飞出屏幕顶
      var x = Math.cos(ang) * r + 4, y = Math.sin(ang) * r * .7, rot = Math.random() * 60 - 30, sc = .7 + Math.random() * .5;
      var a = s.animate([{ transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 0 }, { opacity: 1, offset: .2 },
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ') rotate(' + rot + 'deg)', opacity: 0 }], { duration: 800 + Math.random() * 300, delay: i * 40, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
      done(a, function () { s.remove(); });
    })(i);
  }

  // 小气泡：偶尔说一句（每次打开最多 3 句，不打扰）
  var bj = (new Date().getUTCHours() + 8) % 24, page = document.body.classList.contains('page-kol') ? 'kol' : 'index';
  var LINES = ['今天的AI新鲜出炉啦', 'Grok Bot 在线值班中', '戳我换个表情～', '我帮你盯着 X 呢', '看累了就喝口水吧', page === 'kol' ? 'KOL 们今天又整活了' : '擂台前三，先看这个',
    bj >= 23 || bj < 6 ? '夜深了，早点睡哦' : bj < 11 ? '早呀，速报热乎着' : bj < 14 ? '午饭配速报，刚刚好' : bj < 18 ? '下午也要元气满满' : '晚上好，今天辛苦啦'];
  var SAY = { love: '比心！', sleepy: '好困…zzz', think: '让我想想…', wow: '哇哦！', laugh: '哈哈哈哈', dizzy: '晕乎乎～', cat: '喵～', cool: '酷不酷？', tongue: '略略略', blush: '被你戳害羞了', stars: '好耶！', sparkle: '亮晶晶！', wink: '嘿嘿', happy: '开心！' };
  var bubble = null, bT = 0;
  function say(text) {
    if (!bubble) { bubble = document.createElement('span'); bubble.className = 'bbl'; bubble.setAttribute('role', 'status'); wrap.appendChild(bubble); }
    bubble.textContent = text; clearTimeout(bT);
    if (reduce) { bubble.style.opacity = 1; } else bubble.animate([{ opacity: 0, transform: 'translateY(-4px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: E, fill: 'forwards' });
    bT = setTimeout(function () { bubble.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-3px)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }); }, 2600);
  }
  function chat() { if (said >= 3) return blink(); said++; hop(); say(LINES[Math.random() * LINES.length | 0]); }

  // 戳一下：换表情 + 粒子；偶尔说句和表情对应的话
  function poke(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    morph(null, function (k) { burst(k); if (Math.random() < .45) say(SAY[k] || '嘿！'); });
  }
  wrap.addEventListener('click', poke);
  wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') poke(e); });

  // 眼睛跟着鼠标（只在有鼠标的设备上；rAF 合帧，滚动时不会触发）
  var mouse = false;
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mx = 0, my = 0, raf = 0, box = null, boxT = 0;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; mouse = true;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; if (!inView) return;
        var now = Date.now(); if (!box || now - boxT > 1000) { box = svg.getBoundingClientRect(); boxT = now; }
        var dx = mx - (box.left + box.width / 2), dy = my - (box.top + box.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 260);
        lk.setAttribute('transform', 'translate(' + (dx / d * 2.6 * k).toFixed(2) + ' ' + (dy / d * 1.8 * k).toFixed(2) + ')');
      });
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse = false; lk.removeAttribute('transform'); });
  }

  // 空闲小动作调度：只在页面可见、顶栏在视野里、没在滚动时做
  addEventListener('scroll', function () { lastScroll = Date.now(); }, { passive: true });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(wrap);
  function ok() { return !document.hidden && inView && !busy && Date.now() - lastScroll > 900; }
  function tick() {
    timer = 0;
    if (ok()) {
      var r = Math.random();
      if (r < .5) blink(Math.random() < .25);
      else if (r < .66) wiggle();
      else if (r < .78) glance();
      else if (r < .93) morph(null, function (k) { if (Math.random() < .5) burst(k); });
      else chat();
    }
    schedule();
  }
  function schedule() { if (!reduce && !timer && !document.hidden) timer = setTimeout(tick, 4000 + Math.random() * 4000); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTimeout(timer); timer = 0; } else schedule(); });
  // 开场：打个招呼
  if (!reduce) setTimeout(function () { if (ok()) { hop(); wiggle(); setTimeout(chat, 500); } schedule(); }, 1400);

  window.GrokBot = { blink: blink, wiggle: wiggle, glance: glance, hop: hop, morph: morph, burst: burst, say: say, poke: poke, face: function () { return cur; } };
})();
