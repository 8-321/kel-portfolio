(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SHOT = location.search.indexOf('shot') > -1;
  if (SHOT) document.documentElement.classList.add('shot');

  /* ---------- 主题：墨夜 / 宣纸 ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('kel-theme'); } catch (e) {}
  if (saved) root.setAttribute('data-theme', saved);
  var btn = document.getElementById('themeBtn');
  function syncMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', root.getAttribute('data-theme') === 'paper' ? '#F4F1EA' : '#0B0B0C');
  }
  syncMeta();

  /* ---------- 排版：随性 / 端正 ---------- */
  var chaosBtn = document.getElementById('chaosBtn');
  var quiet = false;
  try { quiet = localStorage.getItem('kel-layout') === 'quiet'; } catch (e) {}
  if (quiet) root.classList.add('quiet');
  chaosBtn && chaosBtn.addEventListener('click', function () {
    quiet = !quiet;
    root.classList.toggle('quiet', quiet);
    try { localStorage.setItem('kel-layout', quiet ? 'quiet' : 'loose'); } catch (e) {}
    chaosBtn.title = quiet ? '排版：端正（点击变随性）' : '排版：随性（点击变端正）';
  });

  btn && btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'paper' ? 'night' : 'paper';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('kel-theme', next); } catch (e) {}
    syncMeta();
  });

  /* ---------- 滚动进度条 ---------- */
  var bar = document.getElementById('progress');
  var nav = document.getElementById('nav');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (nav) nav.classList.toggle('stuck', h.scrollTop > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 出现动效 ---------- */
  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var d = e.target.getAttribute('data-d');
          if (d) e.target.style.transitionDelay = (parseInt(d, 10) * 90) + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- HERO 入场 ---------- */
  var hero = document.getElementById('hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('in'); }, 80); });

  /* ---------- 数字滚动 ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduce || SHOT || !isFinite(target)) { el.textContent = target; return; }
    var t0 = performance.now(), dur = 1100;
    function tick(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { io2.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- 鼠标光标 ---------- */
  var cur = document.getElementById('cursor');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (cur && fine && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cur.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate(' + (cx - 13) + 'px,' + (cy - 13) + 'px)';
      if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) { raf = requestAnimationFrame(loop); }
      else { raf = null; }
    }
    document.querySelectorAll('a,button,.card,.chip,.tag').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cur.classList.add('grow'); });
      el.addEventListener('mouseleave', function () { cur.classList.remove('grow'); });
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
  }

  /* ---------- 卡片跟随光斑 ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    var glow = card.querySelector('.glow');
    if (!glow) return;
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      glow.style.background = 'radial-gradient(60% 100% at ' +
        (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '% 100%, var(--c1), transparent 72%)';
    });
  });

  /* ---------- 图片 / 录屏视差 ---------- */
  var shots = [].slice.call(document.querySelectorAll('.shot img, .shot video'));
  if (fine && !reduce && shots.length) {
    var sraf = null;
    function parallax() {
      sraf = null;
      var vh = window.innerHeight;
      shots.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var c = (r.top + r.height / 2 - vh / 2) / vh;      // -1 .. 1
        el.style.setProperty('--py', (c * 14).toFixed(2) + 'px');
      });
    }
    window.addEventListener('scroll', function () {
      if (!sraf) sraf = requestAnimationFrame(parallax);
    }, { passive: true });
    parallax();
  }

  /* ---------- 深空星场（canvas，自绘，无外部资源） ---------- */
  (function starfield() {
    var cv = document.getElementById('stars');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [];
    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((W * H) / 11000);
      stars = [];
      for (var i = 0; i < n; i++) {
        var d = Math.random();                       // 0 远 → 1 近
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.25 + d * 1.15, d: d,
          a: 0.12 + Math.random() * 0.5,
          v: (0.06 + d * 0.22) / 60,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.16 ? 'violet' : (Math.random() < 0.2 ? 'warm' : 'white')
        });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var sy = window.scrollY * 0.05;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y -= s.v; if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
        var yy = (s.y - sy * s.d) % (H + 4); if (yy < 0) yy += H + 4;
        var tw = 0.55 + 0.45 * Math.sin(t / 900 + s.tw);
        ctx.beginPath();
        ctx.arc(s.x, yy, s.r, 0, 6.2832);
        ctx.fillStyle = s.hue === 'violet' ? 'rgba(150,160,255,' + (s.a * tw) + ')'
                      : s.hue === 'warm' ? 'rgba(255,180,150,' + (s.a * tw) + ')'
                      : 'rgba(235,238,255,' + (s.a * tw) + ')';
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    var frame = null;
    build();
    if (SHOT || reduce) {
      /* 定格：只画一帧静态星空 */
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(235,238,255,' + s.a + ')'; ctx.fill();
      }
    } else {
      frame = requestAnimationFrame(draw);
    }
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { build(); if (SHOT || reduce) {} }, 200);
    });
  })();

  /* ---------- 音效（WebAudio 合成，无外部音频文件） ---------- */
  var soundBtn = document.getElementById('soundBtn');
  var soundOn = true;
  try { soundOn = localStorage.getItem('kel-sound') !== 'off'; } catch (e) {}
  var actx = null;
  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function ping(freq, dur, gain, type) {
    if (!soundOn) return;
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, a.currentTime + dur);
    f.type = 'lowpass'; f.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, a.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(f); f.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  function tick() { ping(1180, 0.09, 0.035, 'triangle'); }
  function clickSnd() { ping(660, 0.16, 0.055, 'sine'); }
  function updateSoundUI() {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.title = soundOn ? '声音：开（点击关闭）' : '声音：关（点击开启）';
  }
  updateSoundUI();
  soundBtn && soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem('kel-sound', soundOn ? 'on' : 'off'); } catch (e) {}
    updateSoundUI();
    if (soundOn) clickSnd();
  });
  document.addEventListener('pointerdown', function () { if (soundOn) audio(); }, { once: true });
  document.querySelectorAll('.btn,.tag,.chip,.ghost-pill,.iconbtn,.mark,.live-card,.card').forEach(function (el) {
    el.addEventListener('mouseenter', tick);
  });
  document.querySelectorAll('a[href],button').forEach(function (el) {
    el.addEventListener('click', clickSnd);
  });

  /* ---------- 锚点平滑滚动（含偏移） ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.pageYOffset - 56;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
