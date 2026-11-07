/* 添加到手机桌面：注册 Service Worker + 按系统（苹果 / 华为 / 安卓 / 微信等内置浏览器）给出添加提示 */
(function () {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var KEY = 'aitoday.a2hs', ua = navigator.userAgent || '';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) return;
  var iOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var harmony = /HarmonyOS|OpenHarmony|ArkWeb/i.test(ua);
  var huawei = harmony || /HuaweiBrowser|HUAWEI|HONOR|HMSCore/i.test(ua);
  var inApp = /MicroMessenger|QQ\/|Weibo|DingTalk|Lark|Feishu|AlipayClient|aweme|Toutiao/i.test(ua);
  var mobile = iOS || android || harmony || /Mobile/i.test(ua);
  var deferred = null, box = null, shown = false;
  function snoozed() { try { var t = +localStorage.getItem(KEY) || 0; return Date.now() - t < 14 * 864e5; } catch (e) { return false; } }
  function snooze() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  var SHARE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function steps() {
    if (inApp) return ['点右上角 <b>···</b>，选「在浏览器打开」', '在浏览器里再按提示添加到桌面'];
    if (iOS) {
      if (/CriOS|EdgiOS|FxiOS/i.test(ua)) return ['点地址栏右侧的分享按钮 <i class="a2-ic">' + SHARE + '</i>', '选「添加到主屏幕」'];
      return ['点 Safari 底部的分享按钮 <i class="a2-ic">' + SHARE + '</i>（iPad 在右上角）', '往下滑，选「添加到主屏幕」，再点「添加」'];
    }
    if (huawei) return ['点浏览器底部的菜单 <b>≡</b>', '选「添加到桌面」（部分版本在「添加至」→「桌面」）', '没反应的话，到「设置 → 应用 → 浏览器 → 权限」打开「创建桌面快捷方式」'];
    return ['点浏览器右上角的菜单 <b>⋮</b>', '选「安装应用」或「添加到主屏幕」', '没反应的话，到手机设置里给浏览器打开「桌面快捷方式」权限'];
  }
  function sysName() { return inApp ? '当前 App 内' : iOS ? '苹果' : huawei ? '华为' : android ? '安卓' : ''; }
  function show() {
    if (shown || snoozed()) return;
    if (!mobile && !deferred) return;
    shown = true;
    box = document.createElement('div');
    box.className = 'a2'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '添加到桌面');
    var oneTap = deferred && !inApp && !iOS;
    box.innerHTML = '<button class="a2-x" type="button" aria-label="关闭">×</button>' +
      '<div class="a2-h"><img src="pwa/icon-192.png" width="44" height="44" alt=""><div><b>把「今日AI速报」放到桌面</b><span>' +
      (oneTap ? '像 App 一样一键打开，不用再找网址' : (sysName() ? sysName() + '：' : '') + '两步就能像 App 一样打开') + '</span></div></div>' +
      (oneTap ? '' : '<ol class="a2-s">' + steps().map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>') +
      '<div class="a2-b">' + (oneTap ? '<button type="button" class="a2-go">添加到桌面</button>' : '') + '<button type="button" class="a2-no">' + (oneTap ? '以后再说' : '知道了') + '</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('on'); });
    box.addEventListener('click', function (e) {
      if (e.target.closest('.a2-go') && deferred) {
        deferred.prompt();
        (deferred.userChoice || Promise.resolve()).then(function () { deferred = null; hide(); });
      } else if (e.target.closest('.a2-x,.a2-no')) { snooze(); hide(); }
    });
  }
  function hide() { if (!box) return; box.classList.remove('on'); var b = box; setTimeout(function () { b.remove(); }, 250); box = null; }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (box && !box.querySelector('.a2-go')) { box.remove(); box = null; shown = false; }
    setTimeout(show, 2500);
  });
  window.addEventListener('appinstalled', function () { snooze(); hide(); });
  window.addEventListener('load', function () { setTimeout(function () { if (!deferred) show(); }, 4000); });
})();
