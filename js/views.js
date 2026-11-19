// Shell, dashboard and lesson pages. Every page renders into `root` and returns an optional cleanup fn.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const esc = TA.esc;
  const I = (TA.ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    fib: '<path d="M3 5h18M3 9h18M3 13.5h18M3 19h18" stroke-dasharray="0"/><path d="M5 19 19 5" stroke-dasharray="2 2"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" stroke="none"/>',
    chart: '<path d="M7 4v16M17 6v12M5 8h4v8H5zM15 9h4v6h-4z"/>',
    cursor: '<path d="M5 3l13 7-6 1.5L9.5 18z"/>',
    magnet: '<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/><path d="M6 8h4M14 8h4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    lock: '<path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
    video: '<path d="M4 6h11v12H4zM15 10l5-3v10l-5-3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  });
  TA.icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

  TA.stepDone = (step, p = TA.progress.get()) => (step.kind === 'lesson' ? !!p.lessons[step.id] : !!(p.exercises[step.id] && p.exercises[step.id].passed));
  TA.nextStep = (p = TA.progress.get()) => TA.PATH.find((s) => !TA.stepDone(s, p)) || null;

  // ---------------- Shell ----------------
  TA.renderNav = function (route) {
    const p = TA.progress.get();
    const item = (href, icon, label, done) => `<a href="${href}" class="nav-item ${route === href ? 'active' : ''}">${TA.icon(icon)}<span>${label}</span>${done ? `<i class="nav-done">${TA.icon('check')}</i>` : ''}</a>`;
    const [fl, fe, ll, le] = TA.PATH.map((s) => TA.stepDone(s, p));
    document.getElementById('nav').innerHTML = `
      <a href="#/" class="brand"><img class="brand-logo" src="assets/adapt-logo.webp" alt=""><span class="brand-name">ADAPT<small>TRADING</small></span></a>
      <div class="nav-group"><div class="nav-label">Learn</div>
        ${item('#/', 'home', 'Dashboard', false)}
      </div>
      <div class="nav-group"><div class="nav-label">01 · Fibonacci</div>
        ${item('#/fibonacci', 'video', 'Masterclass', fl)}
        ${item('#/fibonacci/exercise', 'fib', 'Exercise', fe)}
      </div>
      <div class="nav-group"><div class="nav-label">02 · Liquidity</div>
        ${item('#/liquidity', 'video', 'Masterclass', ll)}
        ${item('#/liquidity/exercise', 'drop', 'Exercise', le)}
      </div>
      <div class="nav-group"><div class="nav-label">For the mentor</div>
        ${item('#/mentor', 'users', 'Mentor view', false)}
      </div>
      <div class="nav-foot"><div class="xp-chip">${TA.icon('bolt')}<b>${TA.progress.xp(p)}</b> XP</div></div>`;
    document.getElementById('tabbar').innerHTML = [
      ['#/', 'home', 'Home'], ['#/fibonacci', 'fib', 'Fibonacci'], ['#/fibonacci/exercise', 'chart', 'Fib drill'], ['#/liquidity', 'drop', 'Liquidity'], ['#/liquidity/exercise', 'target', 'Sweeps'], ['#/mentor', 'users', 'Mentor'],
    ].map(([h, i, l]) => `<a href="${h}" class="${route === h ? 'active' : ''}">${TA.icon(i)}<span>${l}</span></a>`).join('');
  };

  TA.toast = function (html, kind = 'ok') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = html;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2600);
  };
  TA.achieve = function (id) {
    if (!TA.progress.unlock(id)) return;
    const a = TA.ACHIEVEMENTS.find((x) => x.id === id);
    TA.toast(`<span class="toast-ico">${TA.icon('star')}</span><div><b>Achievement unlocked</b><br>${esc(a.title)}</div>`, 'gold');
  };

  const ring = (pct, size = 112) => {
    const r = (size - 12) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg><div class="ring-label"><b>${pct}%</b><span>complete</span></div>`;
  };

  // ---------------- Dashboard ----------------
  TA.views = {};
  TA.views.dashboard = function (root) {
    const p = TA.progress.get();
    const done = TA.PATH.filter((s) => TA.stepDone(s, p)).length;
    const pct = Math.round((done / TA.PATH.length) * 100);
    const next = TA.nextStep(p);
    const ex = Object.values(p.exercises);
    const decisions = ex.reduce((s, e) => s + e.total, 0), right = ex.reduce((s, e) => s + e.best, 0);
    const lessonsDone = TA.PATH.filter((s) => s.kind === 'lesson' && TA.stepDone(s, p)).length;
    const exDone = TA.PATH.filter((s) => s.kind === 'exercise' && TA.stepDone(s, p)).length;
    const nextMod = next && TA.MODULES.find((m) => m.id === next.module);

    root.innerHTML = `
    <div class="page dash">
      <header class="dash-head fade-up">
        <div><p class="eyebrow">Adapt Trading · Interactive mentorship</p>
          <h1>${done === 0 ? 'Welcome, trader.' : done === TA.PATH.length ? 'Path complete. Nice work.' : 'Welcome back, trader.'}</h1>
          <p class="lede">Short lessons, then a real chart. Watch the market unfold one candle at a time and make your own decisions.</p></div>
      </header>

      <section class="hero-card fade-up" style="--d:60ms">
        <div class="hero-ring">${ring(pct)}</div>
        <div class="hero-body">
          ${next ? `<p class="eyebrow">Up next · Module ${nextMod.num} · ${esc(nextMod.title)}</p>
            <h2>${esc(next.title)}</h2><p class="muted">${esc(next.meta)}</p>
            <a class="btn btn-primary btn-lg" href="${next.route}">${done ? 'Continue learning' : 'Start learning'} ${TA.icon('arrow')}</a>`
          : `<p class="eyebrow">All modules complete</p><h2>Replay any exercise to sharpen your eye</h2><p class="muted">More modules plug into this same path.</p>
            <a class="btn btn-primary btn-lg" href="#/fibonacci/exercise">Replay Fibonacci ${TA.icon('arrow')}</a>`}
        </div>
        <div class="hero-stats">
          <div class="stat"><span>${TA.icon('bolt')} XP</span><b>${TA.progress.xp(p)}</b></div>
          <div class="stat"><span>Lessons</span><b>${lessonsDone}<small>/2</small></b></div>
          <div class="stat"><span>Exercises passed</span><b>${exDone}<small>/2</small></b></div>
          <div class="stat"><span>Best decisions</span><b>${decisions ? right + '<small>/' + decisions + '</small>' : '—'}</b></div>
        </div>
      </section>

      <h3 class="section-title fade-up" style="--d:120ms">Your learning path</h3>
      <div class="modules">
        ${TA.MODULES.map((m, mi) => {
          const steps = TA.PATH.filter((s) => s.module === m.id);
          const d = steps.filter((s) => TA.stepDone(s, p)).length;
          return `<article class="module-card fade-up" style="--d:${160 + mi * 60}ms">
            <div class="module-top"><span class="module-num">Module ${m.num}</span><span class="pill ${d === steps.length ? 'pill-done' : d ? 'pill-progress' : ''}">${d === steps.length ? 'Completed' : d ? 'In progress' : 'Not started'}</span></div>
            <h3>${esc(m.title)}</h3><p class="muted">${esc(m.desc)}</p>
            <div class="bar"><i style="width:${(d / steps.length) * 100}%"></i></div>
            <ol class="steps">${steps.map((s) => {
              const sd = TA.stepDone(s, p), cur = next && next.id === s.id;
              return `<li class="${sd ? 'done' : ''} ${cur ? 'current' : ''}"><a href="${s.route}">
                <span class="step-dot">${sd ? TA.icon('check') : TA.icon(s.kind === 'lesson' ? 'video' : 'chart')}</span>
                <span class="step-text"><b>${esc(s.title)}</b><small>${s.kind === 'lesson' ? 'Masterclass' : 'Interactive exercise'} · ${esc(s.meta)}</small></span>
                ${cur ? '<span class="pill pill-progress">Up next</span>' : ''}</a></li>`;
            }).join('')}</ol>
          </article>`;
        }).join('')}
        <article class="module-card module-soon fade-up" style="--d:280ms">
          <div class="module-top"><span class="module-num">Module 03+</span><span class="pill">${TA.icon('lock')} Coming soon</span></div>
          <h3>Next modules</h3><p class="muted">Each new concept follows the same format: a short video, then a replay exercise on a real chart. New lessons are added as data, with no new code.</p>
        </article>
      </div>

      <h3 class="section-title fade-up" style="--d:320ms">Achievements</h3>
      <div class="achievements fade-up" style="--d:340ms">
        ${TA.ACHIEVEMENTS.map((a) => `<div class="ach ${p.achievements.includes(a.id) ? 'on' : ''}"><span class="ach-ico">${TA.icon('star')}</span><b>${esc(a.title)}</b><small>${esc(a.desc)}</small></div>`).join('')}
      </div>
      <p class="dash-foot"><button class="link-btn" id="reset">Reset demo progress</button></p>
    </div>`;
    root.querySelector('#reset').onclick = () => { TA.progress.reset(); TA.route(); };
  };

  // ---------------- Shared lesson building blocks ----------------
  // The mentor's video wins once the file exists; until then the animated explainer fills the reel.
  function reel(file, explainer) {
    return `<div class="reel" data-explainer="${explainer}">
      <video playsinline controls preload="metadata" src="assets/videos/${file}"></video>
      <div class="reel-anim" role="button" aria-label="Play animated overview"></div>
    </div>
    <p class="reel-cap">Animated overview. The mentor's reel replaces it automatically when <code>assets/videos/${file}</code> is added.</p>`;
  }
  function wireReel(root) {
    const players = [];
    root.querySelectorAll('.reel').forEach((r) => {
      const v = r.querySelector('video'), p = TA.mountExplainer(r.querySelector('.reel-anim'), r.dataset.explainer);
      players.push(p);
      v.addEventListener('loadedmetadata', () => { r.classList.add('has-video'); r.nextElementSibling.remove(); p.destroy(); });
    });
    return () => players.forEach((p) => p.destroy());
  }
  function refImage(file, caption) {
    return `<figure class="ref-img"><img src="assets/${file}" alt="${esc(caption)}" onerror="this.parentNode.classList.add('missing')">
      <div class="ref-missing">${TA.icon('video')}<b>Reference screenshot</b><span>Place <code>assets/${file}</code> here</span></div>
      <figcaption>${esc(caption)}</figcaption></figure>`;
  }
  function quiz(el, questions, onDone) {
    let i = 0, right = 0;
    const draw = () => {
      if (i >= questions.length) {
        el.innerHTML = `<div class="quiz-done pop">${TA.icon('check')}<div><b>Knowledge check complete</b><span>${right}/${questions.length} correct on the first try</span></div></div>`;
        onDone && onDone(); return;
      }
      const q = questions[i];
      el.innerHTML = `<div class="quiz-q"><div class="quiz-meta"><span>Question ${i + 1} of ${questions.length}</span><div class="bar sm"><i style="width:${(i / questions.length) * 100}%"></i></div></div>
        <h4>${esc(q.q)}</h4><div class="quiz-opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="quiz-fb"></div></div>`;
      let first = true;
      el.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.answer;
        if (ok && first) right++;
        first = false;
        b.classList.add(ok ? 'right' : 'wrong', 'shake-' + ok);
        const fb = el.querySelector('.quiz-fb');
        if (ok) {
          el.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
          fb.innerHTML = `<div class="fb fb-ok pop">${TA.icon('check')}<span>${esc(q.explain)}</span><button class="btn btn-primary btn-sm">Continue</button></div>`;
          fb.querySelector('button').onclick = () => { i++; draw(); };
        } else fb.innerHTML = `<div class="fb fb-bad pop"><span>Not quite. Try again.</span></div>`;
      }));
    };
    draw();
  }

  // ---------------- Mini illustration charts (SVG) ----------------
  TA.miniChart = function ({ candles, levels = [], zones = [], seps = [], notes = [], w = 340, h = 160 }) {
    const pads = { l: 6, r: 6, t: 14, b: 8 };
    let lo = Math.min(...candles.map((k) => k.low)), hi = Math.max(...candles.map((k) => k.high));
    levels.forEach((l) => { lo = Math.min(lo, l.price); hi = Math.max(hi, l.price); });
    zones.forEach((z) => { lo = Math.min(lo, z.bottom); hi = Math.max(hi, z.top); });
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const n = candles.length, step = (w - pads.l - pads.r) / n, bw = Math.max(2, step * 0.62);
    const X = (i) => pads.l + step * (i + 0.5), Y = (p) => pads.t + ((hi - p) / (hi - lo)) * (h - pads.t - pads.b);
    let s = `<svg class="mini" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">`;
    zones.forEach((z) => { s += `<rect x="${X(z.from) - step / 2}" y="${Y(z.top)}" width="${w - X(z.from) + step / 2}" height="${Y(z.bottom) - Y(z.top)}" fill="${z.color}" opacity=".18"/><text x="${w - 8}" y="${(Y(z.top) + Y(z.bottom)) / 2 + 3}" text-anchor="end" class="mini-lbl" fill="${z.color}">${esc(z.label)}</text>`; });
    seps.forEach((sp) => { s += `<line x1="${X(sp.i) - step / 2}" x2="${X(sp.i) - step / 2}" y1="0" y2="${h}" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 3"/><text x="${X(sp.i) - step / 2 + 4}" y="10" class="mini-sep">${esc(sp.label)}</text>`; });
    levels.forEach((l) => { const y = Y(l.price); s += `<line x1="${X(l.from || 0) - step / 2}" x2="${w}" y1="${y}" y2="${y}" stroke="${l.color}" stroke-width="1.4" ${l.dash ? 'stroke-dasharray="4 3"' : ''}/><text x="${w - 6}" y="${y - 4}" text-anchor="end" class="mini-lbl" fill="${l.color}">${esc(l.label)}</text>`; });
    candles.forEach((k, i) => {
      const c = k.close >= k.open ? '#089981' : '#f23645', x = X(i);
      s += `<line x1="${x}" x2="${x}" y1="${Y(k.high)}" y2="${Y(k.low)}" stroke="${c}"/><rect x="${x - bw / 2}" y="${Y(Math.max(k.open, k.close))}" width="${bw}" height="${Math.max(1, Math.abs(Y(k.open) - Y(k.close)))}" fill="${c}"/>`;
    });
    notes.forEach((nt) => { const k = candles[nt.i]; const y = nt.below ? Y(k.low) + 12 : Y(k.high) - 5; s += `<text x="${X(nt.i)}" y="${y}" text-anchor="middle" class="mini-note">${esc(nt.text)}</text>`; });
    return s + '</svg>';
  };

  // Placeholder visuals for each liquidity concept; replace with the mentor's own examples later.
  function conceptIllustration(id) {
    const b = new TA.Builder({ start: 100, time: 0, tick: 0.25, seed: 7 + id.length * 13 });
    const ext = (a, z) => { const k = b.candles.slice(a, z); return { hi: Math.max(...k.map((c) => c.high)), lo: Math.min(...k.map((c) => c.low)) }; };
    const col = { day: '#4f8cff', session: '#e0b04a', equal: '#e05aa0', gap: '#4f8cff' };
    if (id === 'pd' || id === 'ps' || id === 'asia' || id === 'london') {
      const names = { pd: ['Previous day', 'Today', 'PDH', 'PDL', col.day], ps: ['Previous session', 'Current', 'Prev. session high', 'Prev. session low', col.session], asia: ['Asia', 'London', 'Asian high', 'Asian low', col.session], london: ['London', 'New York', 'London high', 'London low', col.session] }[id];
      const tight = id === 'asia' ? 2 : 4;
      b.walk(104, 6, { vol: tight }).walk(97, 6, { vol: tight }).walk(101, 6, { vol: tight });
      const e = ext(0, 18);
      b.walk(e.hi - 1, 5, { vol: 3, max: e.hi - 0.5 }).walk(e.lo + 2, 6, { vol: 3, min: e.lo + 0.5, max: e.hi - 0.5 }).walk(e.lo + 6, 4, { vol: 3, min: e.lo + 0.5, max: e.hi - 0.5 });
      return TA.miniChart({ candles: b.candles, seps: [{ i: 0, label: names[0] }, { i: 18, label: names[1] }], levels: [{ price: e.hi, label: names[2], color: names[4] }, { price: e.lo, label: names[3], color: names[4], dash: true }] });
    }
    if (id === 'equal') {
      b.walk(108, 5, { vol: 2, max: 109.5 }).ohlc(b.last, 110, b.last - 1, 108.5).walk(103, 5, { vol: 2, max: 109.5, min: 100.5 }).ohlc(b.last, b.last + 1, 100, 101.5)
        .walk(108.5, 6, { vol: 2, max: 109.5, min: 100.5 }).ohlc(b.last, 110, b.last - 1, 107.5).walk(102, 5, { vol: 2, max: 109.5, min: 100.5 }).ohlc(b.last, b.last + 1, 100, 103).walk(106, 3, { vol: 2, max: 109.5, min: 100.5 });
      return TA.miniChart({ candles: b.candles, levels: [{ price: 110, label: 'Equal highs', color: col.equal }, { price: 100, label: 'Equal lows', color: col.equal, dash: true }] });
    }
    // gaps
    const week = id === 'owg';
    b.walk(103, 8, { vol: 2.5 }).walk(98, 7, { vol: 2.5 });
    const closeP = b.last, gapAt = b.n;
    b.jump(closeP + 6).walk(closeP + 9, 5, { vol: 2.5, min: closeP + 3 }).walk(closeP + 5, 6, { vol: 2.5, min: closeP + 1 });
    return TA.miniChart({ candles: b.candles, seps: [{ i: 0, label: week ? 'Friday' : 'Previous day' }, { i: gapAt, label: week ? 'New week' : 'New day' }], zones: [{ from: gapAt, top: closeP + 6, bottom: closeP, color: col.gap, label: week ? 'Opening Week Gap' : 'New Day Gap' }] });
  }
  function sweepDiagram(bearish) {
    // 1 & 2 = close beyond, close back inside; the gap between candle 2 and candle 4 is the FVG; candle 7 retests into it.
    const b = new TA.Builder({ start: 100, time: 0, seed: 3 }), fvg = '#6ea0ff';
    if (bearish) {
      b.walk(104, 5, { vol: 1.5, max: 107.5 }).walk(106, 3, { vol: 1.5, max: 107.5 })
        .ohlc(106, 110.5, 105.5, 109.5).ohlc(109.5, 110, 105, 106).ohlc(106, 106.5, 102, 102.5).ohlc(102.5, 103, 99.5, 100)
        .ohlc(100, 101.5, 99.5, 101).ohlc(101, 104, 100.5, 103.5).walk(94, 4, { vol: 1.2, min: 93, max: 103.5 });
      return TA.miniChart({ candles: b.candles, w: 300, h: 160, levels: [{ price: 108, label: 'Prev. session high', color: '#e0b04a' }],
        zones: [{ from: 9, top: 105, bottom: 103, color: fvg, label: 'FVG' }], notes: [{ i: 8, text: '1' }, { i: 9, text: '2', below: true }, { i: 13, text: 'entry' }] });
    }
    b.walk(96, 5, { vol: 1.5, min: 92.5 }).walk(94, 3, { vol: 1.5, min: 92.5 })
      .ohlc(94, 94.5, 89.5, 90.5).ohlc(90.5, 95, 90, 94).ohlc(94, 98, 93.5, 97.5).ohlc(97.5, 101, 97, 100.5)
      .ohlc(100.5, 101, 98.5, 99).ohlc(99, 99.5, 96, 96.5).walk(106, 4, { vol: 1.2, min: 96.5, max: 107 });
    return TA.miniChart({ candles: b.candles, w: 300, h: 160, levels: [{ price: 92, label: 'Prev. session low', color: '#e0b04a' }],
      zones: [{ from: 9, top: 97, bottom: 95, color: fvg, label: 'FVG' }], notes: [{ i: 8, text: '1', below: true }, { i: 9, text: '2' }, { i: 13, text: 'entry', below: true }] });
  }

  function lessonShell({ module, title, sub, video, explainer, body, cta, ctaHref }) {
    return `<div class="page lesson">
      <a class="crumb" href="#/">${TA.icon('back')} Dashboard</a>
      <header class="lesson-head fade-up"><p class="eyebrow">${esc(module)}</p><h1>${esc(title)}</h1><p class="lede">${sub}</p></header>
      <div class="lesson-grid">
        <aside class="lesson-video fade-up" style="--d:60ms">${reel(video, explainer)}</aside>
        <div class="lesson-body">${body}
          <section class="card cta-card fade-up"><div><b>Ready to practice?</b><span class="muted">Apply this on a live replay chart.</span></div>
            <a class="btn btn-primary btn-lg" href="${ctaHref}" id="cta">${esc(cta)} ${TA.icon('arrow')}</a></section>
        </div>
      </div></div>`;
  }

  // ---------------- Fibonacci masterclass ----------------
  TA.views.fibLesson = function (root) {
    const c = TA.FIB_CONFIG;
    const rows = c.rows.map((r) => `<div class="tv-row ${r.enabled ? '' : 'off'}"><span class="tv-check ${r.enabled ? 'on' : ''}">${r.enabled ? TA.icon('check') : ''}</span>
      <span class="tv-val">${r.value}</span><span class="tv-swatch" style="background:${r.red ? c.colors.red : c.colors.neutral}"></span></div>`).join('');
    const levelCards = c.teaching.map((t) => {
      const row = c.rows.find((r) => r.value === t.value && r.enabled);
      return `<div class="level-card ${row && row.red ? 'red' : ''}"><span class="level-val">${t.value}</span><span>${esc(t.label)}</span></div>`;
    }).join('');
    root.innerHTML = lessonShell({
      module: 'Module 01 · Fibonacci Retracement · Lesson 1', title: 'Fibonacci Settings',
      sub: 'The exact Fibonacci configuration used throughout this mentorship. Every exercise on this platform uses these levels.',
      video: 'fibonacci-settings.mp4', explainer: 'fib',
      cta: 'Start Interactive Exercise', ctaHref: '#/fibonacci/exercise',
      body: `
        <section class="card fade-up" style="--d:100ms"><h2>The configuration</h2>
          <p class="muted">Recreate these settings in TradingView. Duplicate slots that are switched off stay off. Only the enabled levels are drawn.</p>
          <div class="settings-split">
            <div class="tv-dialog"><div class="tv-title">Fib Retracement</div>
              <div class="tv-tabs"><span class="on">Style</span><span>Coordinates</span><span>Visibility</span></div>
              <div class="tv-line"><span class="tv-check ${c.trendLine ? 'on' : ''}"></span>Trend line <em>${c.trendLine ? 'on' : 'off'}</em></div>
              <div class="tv-grid">${rows}</div>
              <div class="tv-line">Extend <span class="tv-select">${esc(c.extend)}</span></div>
            </div>
            ${refImage('fibonacci-settings.png', 'Original TradingView settings (source of truth)')}
          </div>
        </section>
        <section class="card fade-up" style="--d:140ms"><h2>What each level means</h2>
          <div class="level-grid">${levelCards}</div>
          <p class="fine">Also enabled in the configuration: 0, 1, −0.272, −0.618 and −1. Red levels follow the original settings.</p>
        </section>
        <section class="card fade-up" style="--d:180ms"><h2>Before you trade it</h2>
          <div class="rule-list">
            <div class="rule"><span class="rule-num">1</span><div><b>Draw it in the direction of the impulse</b><span class="muted">Bullish impulse: from the swing low to the swing high.</span></div></div>
            <div class="rule"><span class="rule-num">2</span><div><b>A touch is not an entry</b><span class="muted">Price reaching a level does not make a trade by itself.</span></div></div>
            <div class="rule"><span class="rule-num">3</span><div><b>Look for a RIC</b><span class="muted"><b>R</b>ejection: price tests the level and rejects it. <b>I</b>mpulsion: price moves strongly away. <b>C</b>orrection: price tries to retest the level and fails to reach it, or touches it and rejects again.</span></div></div>
          </div>
        </section>
        <section class="card fade-up"><h2>Reference trades</h2>
          <div class="ref-pair">${refImage('fibonacci-valid-example.png', 'Valid Fibonacci trade')}${refImage('fibonacci-invalid-example.png', 'Invalid Fibonacci trade')}</div>
        </section>
        <section class="card fade-up"><h2>Quick check</h2><div id="quiz"></div></section>`,
    });
    const stopReel = wireReel(root);
    quiz(root.querySelector('#quiz'), TA.QUIZ.fib, () => { TA.progress.completeLesson('fibLesson'); TA.renderNav(location.hash || '#/'); });
    root.querySelector('#cta').addEventListener('click', () => TA.progress.completeLesson('fibLesson'));
    return stopReel;
  };

  // ---------------- Liquidity masterclass ----------------
  TA.views.liqLesson = function (root) {
    root.innerHTML = lessonShell({
      module: 'Module 02 · Liquidity · Lesson 1', title: 'Liquidity Levels',
      sub: 'Where liquidity rests on the chart, and the simplified two-candle confirmation used in the exercises.',
      video: 'liquidity-levels.mp4', explainer: 'liq',
      cta: 'Start Liquidity Exercise', ctaHref: '#/liquidity/exercise',
      body: `
        <section class="card fade-up" style="--d:100ms"><h2>Seven liquidity references</h2>
          <p class="fine">Placeholder descriptions and visuals. Your mentor's material will replace them.</p>
          <div class="concepts">${TA.LIQUIDITY_CONCEPTS.map((c, i) => `<article class="concept"><div class="concept-viz">${conceptIllustration(c.id)}</div>
            <div class="concept-text"><span class="concept-num">${String(i + 1).padStart(2, '0')}</span><b>${esc(c.title)}</b><span class="muted">${esc(c.text)}</span></div></article>`).join('')}</div>
        </section>
        <section class="card fade-up"><h2>The sweep: close &amp; reverse, then the FVG entry</h2>
          <p class="muted">A simplified version of the method. Your mentor will add the full entry requirements.</p>
          <div class="sweep-pair">
            <div class="sweep"><div class="sweep-viz">${sweepDiagram(true)}</div><b class="down">Previous Session High → potential short</b>
              <ol><li><b>Candle 1</b> breaks above the high and <em>closes above</em>.</li><li><b>Candle 2</b> breaks back below and <em>closes below</em>.</li>
                <li>Price displaces down and leaves a <em>Fair Value Gap</em>.</li><li>Price retests back toward the level, into the FVG: <em>entry</em>.</li></ol></div>
            <div class="sweep"><div class="sweep-viz">${sweepDiagram(false)}</div><b class="up">Previous Session Low → potential long</b>
              <ol><li><b>Candle 1</b> breaks below the low and <em>closes below</em>.</li><li><b>Candle 2</b> breaks back above and <em>closes above</em>.</li>
                <li>Price displaces up and leaves a <em>Fair Value Gap</em>.</li><li>Price retests back toward the level, into the FVG: <em>entry</em>.</li></ol></div>
          </div>
          <p class="fine">Fair Value Gap (FVG): a three-candle gap where the wicks of the first and third candles don't overlap.</p>
        </section>
        <section class="card fade-up"><h2>Quick check</h2><div id="quiz"></div></section>`,
    });
    const stopReel = wireReel(root);
    quiz(root.querySelector('#quiz'), TA.QUIZ.liq, () => { TA.progress.completeLesson('liqLesson'); TA.renderNav(location.hash || '#/'); });
    root.querySelector('#cta').addEventListener('click', () => TA.progress.completeLesson('liqLesson'));
    return stopReel;
  };
})(window.TA);
