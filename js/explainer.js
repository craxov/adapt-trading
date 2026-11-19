// Animated 9:16 explainers that fill the lesson reel until the mentor's own video is added.
// Each explainer is a timeline (acts → candle reveal keyframes, overlays, captions) rendered from `t`,
// so pause/replay is just a matter of moving the clock.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const lerp = (a, b, t) => a + (b - a) * t, c01 = (t) => Math.max(0, Math.min(1, t));
  const ease = (t) => 1 - Math.pow(1 - c01(t), 3);
  const keyed = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let k = 1; k < keys.length; k++) { const [t1, v1] = keys[k], [t0, v0] = keys[k - 1]; if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0 || 1)); }
    return keys[keys.length - 1][1];
  };
  const FONT = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  const GOLD = '#e0b04a', BLUE = '#2962ff', UP = '#089981', DOWN = '#f23645', ACCENT = '#4a8dff';
  const LOGO = new Image(); LOGO.src = 'assets/adapt-logo.webp';

  // ---------------- timelines ----------------
  function fibExplainer() {
    const sc = TA.SCENARIOS.fibonacci, c = sc.candles, o = sc.historyEnd - 7;
    const dp1 = sc.decisions[0].at, { rejection: R, impulsion: I, correction: C } = sc.ricMarks;
    const tr = Object.assign({ dir: 'buy', entry: c[C].close, entryIndex: C }, sc.decisions[1].trades.buy);
    const exit = TA.simulateTrade(c, tr).index;
    const say = (v) => TA.FIB_CONFIG.teaching.find((x) => x.value === v).label;
    const lv = [[0, 7.5], [1, 7.5], [0.236, 8.2], [0.382, 9.3], [0.5, 10.4], [0.618, 11.5], [0.65, 12.6], [0.71, 12.6], [0.786, 13.8], [0.886, 15], [-0.272, 16.3], [-0.618, 16.3], [-1, 16.3]];
    return [{
      dur: 39, candles: c, from: o, range: [20994, 21106], // extensions sit above the frame; the caption names them
      reveal: [[0, o + 8], [2.5, o + 8], [6, sc.introEnd + 1], [17.5, sc.introEnd + 1], [21, dp1 + 1], [23.5, dp1 + 1], [26, R + 1], [27.8, I + 1], [29.6, C + 1], [31.5, C + 1], [36, Math.min(c.length, exit + 3)]],
      fib: {
        t0: 6, dur: 1.4, p1: sc.swing.low, p2: sc.swing.high, levels: lv.map(([value, t]) => ({ value, t })),
        focus: [[8.2, 9.3, [0.236]], [9.3, 10.4, [0.382]], [10.4, 11.5, [0.5]], [11.5, 12.6, [0.618]], [12.6, 13.8, [0.65, 0.71]], [13.8, 15, [0.786]], [15, 16.3, [0.886]],
          [16.3, 17.5, [-0.272, -0.618, -1]], [17.5, 23.5, [0.382]], [23.5, 31.5, [0.5]]],
      },
      marks: [{ t: 21.3, i: dp1, text: '✕ no rejection', color: DOWN, below: true }, { t: 26, i: R, text: 'R', color: BLUE, below: true }, { t: 27.8, i: I, text: 'I', color: BLUE }, { t: 29.6, i: C, text: 'C', color: BLUE, below: true }],
      trade: Object.assign({ t: 30.4, exit }, tr),
      captions: [
        [2.5, 6, 'Impulse', 'An impulsive move forms.'],
        [6, 7.5, 'Draw', 'Draw from the swing low to the swing high.'],
        [8.2, 9.3, '0.236', say(0.236)], [9.3, 10.4, '0.382', say(0.382)], [10.4, 11.5, '0.5', say(0.5)],
        [11.5, 12.6, '0.618', say(0.618)], [12.6, 13.8, '0.65 · 0.71', 'Additional custom levels'], [13.8, 15, '0.786', say(0.786)],
        [15, 16.3, '0.886', say(0.886)], [16.3, 17.5, 'Also enabled', '−0.272, −0.618 and −1, above the swing.'],
        [17.5, 21, 'Pullback', 'Price pulls back into the 38.2…'], [21, 23.5, 'Wait', '…no rejection. A touch alone is not an entry.'],
        [23.5, 26, 'Pullback', 'Price reaches the 50.'], [26, 27.8, 'R · Rejection', 'Price tests the 50 and rejects it.'],
        [27.8, 29.6, 'I · Impulsion', 'Price moves strongly away.'], [29.6, 31.5, 'C · Correction', 'The retest fails to reach the 50.'],
        [31.5, 36, 'Entry', 'RIC confirmed. Long entry.'],
      ],
      cards: [[0, 2.5, 'Fibonacci Settings', 'Animated overview'], [36, 39, 'Your turn', 'Draw it and trade the replay.']],
    }];
  }

  function liqExplainer() {
    const A = TA.SCENARIOS.liqA, a = A.candles, ca = A.check, g = ca.fvg;
    const trA = Object.assign({ dir: 'sell', entry: a[g.entry].close, entryIndex: g.entry }, A.decisions[0].trades.sell);
    const exitA = TA.simulateTrade(a, trA).index;
    const B = TA.SCENARIOS.liqC, b = B.candles, cb = B.check;
    return [{
      dur: 27, candles: a, from: 0,
      reveal: [[0, ca.sessionEnd], [5, ca.sessionEnd], [9, ca.c1], [11, ca.c1 + 1], [11.6, ca.c1 + 1], [13.4, ca.c2 + 1], [14, ca.c2 + 1],
        [16, g.f3 + 1], [18, g.f3 + 1], [20.5, g.entry + 1], [22, g.entry + 1], [26.5, Math.min(a.length, exitA + 2)]],
      levels: A.levels.map((l, k) => Object.assign({ t: 2.7 + k * 0.5 }, l)),
      zones: A.zones.map((z) => Object.assign({ t: 16.1 }, z)),
      seps: A.separators,
      marks: [{ t: 11, i: ca.c1, text: '1', color: GOLD }, { t: 13.4, i: ca.c2, text: '2', color: GOLD, below: true }, { t: 20.5, i: g.entry, text: 'retest', color: BLUE }],
      trade: Object.assign({ t: 21, exit: exitA }, trA),
      captions: [
        [2.5, 5, 'Liquidity', 'Previous Session High and Low.'],
        [5, 9, 'Approach', 'New York returns to the session high.'],
        [9, 11.6, 'Candle 1', 'Breaks above the high and closes above.'],
        [11.6, 14, 'Candle 2', 'Breaks back below and closes below. Sweep confirmed.'],
        [14, 18, 'Displacement', 'Price drops hard and leaves a Fair Value Gap (FVG).'],
        [18, 20.8, 'Retest', 'Price retraces back toward the level, into the FVG.'],
        [20.8, 22.5, 'Entry', 'Short from the FVG. Stop above the sweep high.'],
        [22.5, 27, 'Target', 'Price reverses toward the session low.'],
      ],
      cards: [[0, 2.5, 'Liquidity Sweep', 'Animated overview']],
    }, {
      dur: 14, candles: b, from: 0,
      reveal: [[0, B.historyEnd + 1], [2, B.historyEnd + 1], [4.5, cb.c1], [6.3, cb.c1 + 1], [6.6, cb.c1 + 1], [8.4, cb.c2 + 1], [11, cb.c2 + 4]],
      levels: B.levels.map((l) => Object.assign({ t: 0.3 }, l)),
      seps: B.separators,
      marks: (B.markers || []).map((m) => Object.assign({ t: 0.3 }, m)).concat([{ t: 6.3, i: cb.c1, text: '1', color: GOLD, below: true }, { t: 8.4, i: cb.c2, text: '2', color: GOLD }, { t: 9.2, i: cb.c2 + 3, text: 'WAIT', color: '#5d6370', below: true }]),
      captions: [
        [0, 4.5, 'Compare', 'Price returns to the Equal Highs.'],
        [4.5, 6.6, 'Candle 1', 'Breaks above and closes above.'],
        [6.6, 8.6, 'Candle 2', 'Also closes above. No close back below.'],
        [8.6, 11, 'Not confirmed', 'That is a breakout, not a sweep. Wait.'],
      ],
      cards: [[11, 14, 'Your turn', 'Lows mirror it: close below, then back above.']],
    }];
  }
  TA.EXPLAINERS = { fib: fibExplainer, liq: liqExplainer };

  // ---------------- renderer ----------------
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    for (const w of words) { const s = line ? line + ' ' + w : w; if (ctx.measureText(s).width > maxW && line) { lines.push(line); line = w; } else line = s; }
    if (line) lines.push(line); return lines;
  }
  function pill(ctx, text, x, y, bg, fg, font) {
    ctx.font = font; const w = ctx.measureText(text).width + 12, h = 18;
    ctx.fillStyle = bg; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 5) : ctx.rect(x - w / 2, y - h / 2, w, h)); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 0.5);
  }

  function drawAct(ctx, act, t, W, H) {
    const c = act.candles, from = act.from;
    const X0 = 12, X1 = W - 46, Y0 = 62, Y1 = Math.round(H * 0.7);
    if (!act._range) {
      const ks = c.slice(from); let lo = Math.min(...ks.map((k) => k.low)), hi = Math.max(...ks.map((k) => k.high));
      (act.levels || []).forEach((l) => { lo = Math.min(lo, l.price); hi = Math.max(hi, l.price); });
      const pad = (hi - lo) * 0.08; act._range = act.range || [lo - pad, hi + pad];
    }
    const [lo, hi] = act._range, sp = (X1 - X0) / (c.length - from);
    const x = (i) => X0 + (i - from + 0.5) * sp, y = (p) => Y0 + ((hi - p) / (hi - lo)) * (Y1 - Y0);

    ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k <= 4; k++) { const yy = Math.round(lerp(Y0, Y1, k / 4)) + 0.5; ctx.moveTo(0, yy); ctx.lineTo(W, yy); } ctx.stroke();

    (act.seps || []).forEach((s) => {
      const xx = Math.round(x(s.i) - sp / 2) + 0.5;
      if (s.i > from) { ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xx, Y0 - 6); ctx.lineTo(xx, Y1); ctx.stroke(); ctx.setLineDash([]); }
      ctx.font = `600 9px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(s.label.toUpperCase(), Math.max(X0, xx + 4), Y0 - 4);
    });

    (act.zones || []).forEach((z) => {
      const p = ease((t - z.t) / 0.5); if (p <= 0) return;
      const xs = x(z.from) - sp / 2, y0 = y(z.top), y1 = y(z.bottom);
      ctx.globalAlpha = p; ctx.fillStyle = z.color; ctx.fillRect(xs, y0, (W - 4 - xs) * p, y1 - y0);
      ctx.strokeStyle = z.border; ctx.strokeRect(xs, y0, (W - 4 - xs) * p, y1 - y0);
      ctx.font = `700 10px ${FONT}`; ctx.fillStyle = z.border; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(z.label, W - 8, (y0 + y1) / 2);
      ctx.globalAlpha = 1;
    });

    (act.levels || []).forEach((l) => {
      const p = ease((t - l.t) / 0.7); if (p <= 0) return;
      const yy = Math.round(y(l.price)) + 0.5, xs = x(l.from || from);
      ctx.globalAlpha = p; ctx.strokeStyle = l.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xs, yy); ctx.lineTo(lerp(xs, W - 4, p), yy); ctx.stroke();
      ctx.font = `600 10px ${FONT}`; ctx.fillStyle = l.color; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(l.label, W - 6, yy - 3);
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    });

    const tr = act.trade;
    if (tr && t >= tr.t) {
      const p = ease((t - tr.t) / 0.5), xa = x(tr.entryIndex) - sp / 2;
      ctx.globalAlpha = p;
      ctx.fillStyle = 'rgba(8,153,129,0.22)'; ctx.fillRect(xa, Math.min(y(tr.entry), y(tr.tp)), X1 + 30 - xa, Math.abs(y(tr.tp) - y(tr.entry)));
      ctx.fillStyle = 'rgba(242,54,69,0.22)'; ctx.fillRect(xa, Math.min(y(tr.entry), y(tr.sl)), X1 + 30 - xa, Math.abs(y(tr.sl) - y(tr.entry)));
      ctx.strokeStyle = 'rgba(220,224,232,.7)'; ctx.beginPath(); ctx.moveTo(xa, y(tr.entry)); ctx.lineTo(X1 + 30, y(tr.entry)); ctx.stroke();
      ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7fe0c8'; ctx.fillText('TARGET', xa + 4, y(tr.tp) + (tr.dir === 'buy' ? 8 : -8));
      ctx.fillStyle = '#ff9aa2'; ctx.fillText('STOP', xa + 4, y(tr.sl) + (tr.dir === 'buy' ? -7 : 7));
      ctx.globalAlpha = 1;
    }

    const count = keyed(act.reveal, t), full = Math.floor(count), frac = count - full;
    const bw = Math.max(1.5, sp * 0.68);
    const candle = (k, xx) => {
      const col = k.close >= k.open ? UP : DOWN; ctx.fillStyle = col;
      ctx.fillRect(Math.round(xx) - 0.5, y(k.high), 1, Math.max(1, y(k.low) - y(k.high)));
      const top = y(Math.max(k.open, k.close)); ctx.fillRect(xx - bw / 2, top, bw, Math.max(1, y(Math.min(k.open, k.close)) - top));
    };
    for (let i = from; i < Math.min(full, c.length); i++) candle(c[i], x(i));
    if (frac > 0.02 && full < c.length) {
      const k = c[full], f = ease(frac);
      candle({ open: k.open, close: lerp(k.open, k.close, f), high: lerp(Math.max(k.open, k.close), k.high, f), low: lerp(Math.min(k.open, k.close), k.low, f) }, x(full));
    }
    if (tr && t >= tr.t && full > tr.exit) pill(ctx, 'Target hit ✓', x(tr.exit), y(tr.tp) - 14, UP, '#fff', `700 10px ${FONT}`);

    const fb = act.fib;
    if (fb && t >= fb.t0) {
      const p = ease((t - fb.t0) / fb.dur), x1 = x(fb.p1.i), y1 = y(fb.p1.price);
      const x2 = lerp(x1, x(fb.p2.i), p), y2 = lerp(y1, y(fb.p2.price), p);
      const focus = (fb.focus.find((f) => t >= f[0] && t < f[1]) || [0, 0, []])[2];
      fb.levels.forEach((L) => {
        const a = ease((t - L.t) / 0.5); if (a <= 0) return;
        const price = TA.fibPrice(fb, L.value); if (price > hi || price < lo) return;
        const row = TA.FIB_CONFIG.rows.find((r) => r.enabled && r.value === L.value), col = row && row.red ? TA.FIB_CONFIG.colors.red : '#a3a7b0';
        const on = focus.includes(L.value), yy = Math.round(y(price)) + 0.5;
        ctx.globalAlpha = a * (focus.length && !on ? 0.45 : 1); ctx.strokeStyle = col; ctx.lineWidth = on ? 2.2 : 1;
        ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(lerp(x1, W - 4, a), yy); ctx.stroke(); ctx.lineWidth = 1;
        if (on) pill(ctx, String(L.value), W - 22, yy, col, '#fff', `700 10px ${MONO}`);
        else { ctx.font = `10px ${MONO}`; ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(L.value), W - 6, yy); }
        ctx.globalAlpha = 1;
      });
      if (p < 1 || t < fb.t0 + fb.dur + 0.6) { // the drag gesture, faded out once placed (trend line is off in the settings)
        ctx.globalAlpha = 1 - c01((t - fb.t0 - fb.dur) / 0.6);
        ctx.strokeStyle = BLUE; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      [[x1, y1], [x2, y2]].forEach(([ax, ay]) => { ctx.fillStyle = '#0f1115'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1; });
    }

    (act.marks || []).forEach((m) => {
      const p = c01((t - m.t) / 0.3); if (p <= 0) return;
      const k = c[m.i], yy = m.price != null ? y(m.price) + (m.below ? 10 : -10) : m.below ? y(k.low) + 14 : y(k.high) - 14;
      ctx.save(); ctx.translate(x(m.i), yy); ctx.scale(0.6 + 0.4 * ease(p), 0.6 + 0.4 * ease(p)); ctx.globalAlpha = p;
      if (m.text === '=') { ctx.font = `700 12px ${FONT}`; ctx.fillStyle = m.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('=', 0, 0); }
      else pill(ctx, m.text, 0, 0, m.color, '#fff', `700 ${m.text.length < 3 ? 11 : 9.5}px ${FONT}`);
      ctx.restore();
    });

    const cap = act.captions.find((k) => t >= k[0] && t < k[1]);
    if (cap) {
      const a = Math.min(c01((t - cap[0]) / 0.25), c01((cap[1] - t) / 0.25));
      ctx.globalAlpha = a; const yy = Y1 + 30 + (1 - a) * 6;
      ctx.font = `700 11px ${FONT}`; ctx.fillStyle = ACCENT; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(cap[2].toUpperCase(), 18, yy);
      ctx.font = `700 ${W < 300 ? 15 : 17}px ${FONT}`; ctx.fillStyle = '#f2f3f5';
      wrap(ctx, cap[3], W - 36).forEach((ln, k) => ctx.fillText(ln, 18, yy + 24 + k * 23));
      ctx.globalAlpha = 1;
    }

    const card = (act.cards || []).find((k) => t >= k[0] && t <= k[1]);
    if (card) {
      const a = Math.min(card[0] === 0 ? 1 : c01((t - card[0]) / 0.35), card[1] === act.dur ? 1 : c01((card[1] - t) / 0.35));
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(9,10,12,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (LOGO.complete && LOGO.naturalWidth) ctx.drawImage(LOGO, W / 2 - 34, H * 0.4 - 132, 68, 68);
      ctx.fillStyle = ACCENT; ctx.font = `700 11px ${FONT}`; ctx.fillText(TA.APP_NAME.toUpperCase(), W / 2, H * 0.4 - 34);
      ctx.fillStyle = '#fff'; ctx.font = `800 ${W < 300 ? 22 : 26}px ${FONT}`; ctx.fillText(card[2], W / 2, H * 0.4);
      ctx.fillStyle = '#9aa0aa'; ctx.font = `500 14px ${FONT}`;
      wrap(ctx, card[3], W - 48).forEach((ln, k) => ctx.fillText(ln, W / 2, H * 0.4 + 30 + k * 19));
      ctx.globalAlpha = 1;
    }
  }

  TA.mountExplainer = function (host, id) {
    const acts = TA.EXPLAINERS[id](), total = acts.reduce((s, a) => s + a.dur, 0);
    const canvas = document.createElement('canvas'); canvas.className = 'reel-canvas'; host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, time = 0, playing = false, last = 0, raf = 0;

    function render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0d0f12'; ctx.fillRect(0, 0, W, H);
      let t = time, ai = 0; while (ai < acts.length - 1 && t >= acts[ai].dur) { t -= acts[ai].dur; ai++; }
      drawAct(ctx, acts[ai], Math.min(t, acts[ai].dur), W, H);
      // story-style progress segments, one per act
      const gap = 4, segW = (W - 24 - gap * (acts.length - 1)) / acts.length; let acc = 0;
      acts.forEach((a, k) => {
        const p = c01((time - acc) / a.dur); acc += a.dur;
        const sx = 12 + k * (segW + gap);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sx, 12, segW, 3);
        ctx.fillStyle = '#fff'; ctx.fillRect(sx, 12, segW * p, 3);
      });
      ctx.font = `600 10.5px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Animated overview', 12, 32);
      if (!playing) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(W / 2, H * 0.62, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        if (time >= total) { ctx.font = `600 26px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('↻', W / 2, H * 0.62 + 1); }
        else { ctx.beginPath(); ctx.moveTo(W / 2 - 9, H * 0.62 - 13); ctx.lineTo(W / 2 - 9, H * 0.62 + 13); ctx.lineTo(W / 2 + 14, H * 0.62); ctx.fill(); }
      }
    }
    function loop(now) {
      if (!playing) return;
      time = Math.min(total, time + Math.min(0.1, (now - last) / 1000)); last = now;
      if (time >= total) playing = false;
      render(); if (playing) raf = requestAnimationFrame(loop);
    }
    const api = {
      play() { if (time >= total) time = 0; playing = true; last = performance.now(); raf = requestAnimationFrame(loop); },
      pause() { playing = false; cancelAnimationFrame(raf); render(); },
      toggle() { playing ? api.pause() : api.play(); },
      seek(t) { time = Math.max(0, Math.min(total, t)); render(); },
      destroy() { playing = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); },
    };
    host.addEventListener('click', api.toggle);
    host.explainer = api; // handle for scrubbing/tests
    const ro = new ResizeObserver(() => {
      const r = host.getBoundingClientRect(); W = Math.floor(r.width); H = Math.floor(r.height); dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; render();
    });
    ro.observe(host);
    return api;
  };
})(window.TA);
