// TradingChart — canvas candlestick chart in the style of TradingView, with a Fibonacci drawing tool,
// horizontal levels, session separators, a long/short position box, crosshair, zoom and pan.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const C = {
    bg: '#0f1115', grid: 'rgba(255,255,255,0.045)', text: '#868c97', border: '#262a31',
    up: '#089981', down: '#f23645', cross: 'rgba(190,196,206,0.55)', tag: '#363a45',
  };
  const AXIS_W = 74, AXIS_H = 28, ANCHOR = 0.6;
  const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const niceStep = (raw) => { const p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; };

  class TradingChart {
    constructor(el, opts = {}) {
      this.el = el; this.tick = opts.tick || 0.25; this.symbol = opts.symbol || '';
      this.canvas = document.createElement('canvas'); this.canvas.className = 'tc-canvas';
      el.appendChild(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.candles = []; this.barSpacing = opts.barSpacing || 11; this.rightIndex = 0; this.follow = true;
      this.levels = []; this.zones = []; this.separators = []; this.markers = []; this.trade = null;
      this.fib = null; this.draft = null; this.fibLevels = TA.fibLevels(); this.tool = 'cursor'; this.magnet = true; this.locked = false;
      this.mouse = null; this.drag = null; this.listeners = {};
      const c = this.canvas;
      this._down = (e) => this.onDown(e); this._move = (e) => this.onMove(e); this._up = (e) => this.onUp(e);
      c.addEventListener('pointerdown', this._down); c.addEventListener('pointermove', this._move);
      c.addEventListener('pointerup', this._up); c.addEventListener('pointercancel', this._up);
      c.addEventListener('pointerleave', () => { if (!this.drag) { this.mouse = null; this.emit('hover', null); this.requestRender(); } });
      c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
      c.addEventListener('dblclick', (e) => { if (!this.hitAnchor(this.pt(e))) this.resetView(); });
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el);
      this.resize();
    }
    on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); }
    emit(evt, ...a) { (this.listeners[evt] || []).forEach((f) => f(...a)); }
    destroy() { this.ro.disconnect(); cancelAnimationFrame(this.raf); this.canvas.remove(); this.listeners = {}; }

    resize() {
      const r = this.el.getBoundingClientRect();
      this.w = Math.max(220, Math.floor(r.width)); this.h = Math.max(180, Math.floor(r.height));
      this.dpr = window.devicePixelRatio || 1;
      this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr;
      this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
      if (this.follow) this.resetView(); else this.update();
      this.render();
    }
    requestRender() { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); }); }
    get pw() { return this.w - AXIS_W; }
    get ph() { return this.h - AXIS_H; }

    setCandles(arr) { this.candles = arr; this.update(); }
    // Latest candle sits at ANCHOR of the plot width, leaving room on the right like a replay.
    centerIndex() { return this.candles.length - 1 + (this.pw * (1 - ANCHOR)) / this.barSpacing; }
    update() {
      if (this.follow) this.rightIndex = this.centerIndex();
      // The user moved the view: leave it alone unless the newest candle would land off-screen.
      else if (this.x(this.candles.length - 1) > this.pw - this.barSpacing * 2) this.rightIndex = this.centerIndex();
      this.requestRender();
    }
    // fitBars: size the bars so a whole replay fits left of the anchor without scrolling.
    resetView(fitBars) {
      if (fitBars !== undefined) this.fitBars = fitBars;
      this.barSpacing = this.fitBars ? TA.clamp((this.pw * ANCHOR) / (this.fitBars + 2), 4, 16) : 11;
      this.follow = true; this.update();
    }
    zoom(f, x = this.pw) {
      const at = this.idx(x);
      this.barSpacing = TA.clamp(this.barSpacing * f, 2.5, 48);
      this.rightIndex = at + (this.pw - x) / this.barSpacing;
      this.follow = false; this.requestRender();
    }
    setTool(t) { this.tool = t; this.draft = null; this.emit('tool', t); this.requestRender(); }
    deleteFib() { this.fib = null; this.draft = null; this.emit('fib', null); this.requestRender(); }

    // ---- coordinates ----
    x(i) { return this.pw - (this.rightIndex - i) * this.barSpacing; }
    idx(x) { return this.rightIndex - (this.pw - x) / this.barSpacing; }
    y(p) { return this.pTop + ((this.pMax - p) / (this.pMax - this.pMin)) * this.pH; }
    price(y) { return this.pMax - ((y - this.pTop) / this.pH) * (this.pMax - this.pMin); }
    timeAt(i) {
      const n = this.candles.length; if (!n) return 0;
      if (i < n) return this.candles[Math.max(0, i)].time;
      return this.candles[n - 1].time + (i - n + 1) * 60;
    }
    visibleRange() { return [Math.max(0, Math.floor(this.idx(0))), Math.min(this.candles.length - 1, Math.ceil(this.idx(this.pw)))]; }

    computeScale() {
      let lo = Infinity, hi = -Infinity;
      const [a, b] = this.visibleRange();
      for (let i = a; i <= b; i++) { const k = this.candles[i]; if (k.low < lo) lo = k.low; if (k.high > hi) hi = k.high; }
      if (lo === Infinity) { const k = this.candles[this.candles.length - 1]; lo = k ? k.low : 0; hi = k ? k.high : 1; }
      const extra = [];
      if (this.trade) extra.push(this.trade.sl, this.trade.tp);
      if (this.fib && !this.drag) extra.push(this.fib.p1.price, this.fib.p2.price);
      this.levels.forEach((l) => l.autoscale && extra.push(l.price));
      extra.forEach((p) => { lo = Math.min(lo, p); hi = Math.max(hi, p); });
      if (hi - lo < this.tick * 8) { const m = (hi + lo) / 2; lo = m - this.tick * 4; hi = m + this.tick * 4; }
      const pad = (hi - lo) * 0.09;
      // While dragging keep the scale frozen so the anchor stays under the pointer.
      if (this.drag && this.drag.type !== 'pan' && this.pMin != null) return;
      this.pMin = lo - pad; this.pMax = hi + pad; this.pTop = 10; this.pH = this.ph - 20;
    }

    // ---- interaction ----
    pt(e) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    snap(p) {
      const i = Math.max(0, Math.round(this.idx(p.x)));
      let price = Math.round(this.price(p.y) / this.tick) * this.tick;
      const k = this.candles[i];
      if (this.magnet && k) {
        let best = null, bd = Infinity;
        for (const v of [k.high, k.low, k.open, k.close]) { const d = Math.abs(this.y(v) - p.y); if (d < bd) { bd = d; best = v; } }
        if (bd < 40) price = best;
      }
      return { i, price };
    }
    hitAnchor(p) {
      if (!this.fib || this.locked) return null;
      for (const key of ['p1', 'p2']) { const a = this.fib[key]; if (Math.hypot(this.x(a.i) - p.x, this.y(a.price) - p.y) < 12) return key; }
      return null;
    }
    inPlot(p) { return p.x >= 0 && p.x < this.pw && p.y >= 0 && p.y < this.ph; }
    onDown(e) {
      const p = this.pt(e);
      if (!this.inPlot(p)) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.mouse = p;
      if (this.draft && this.draft.clickMode) { this.draft.p2 = this.snap(p); this.finishDraft(); return; }
      const a = this.hitAnchor(p);
      if (a) { this.drag = { type: 'anchor', key: a }; return; }
      if (this.tool === 'fib' && !this.locked) {
        const s = this.snap(p);
        this.draft = { p1: s, p2: s, start: p }; this.drag = { type: 'draw' }; this.requestRender(); return;
      }
      this.drag = { type: 'pan', x: p.x, ri: this.rightIndex }; this.canvas.style.cursor = 'grabbing';
    }
    onMove(e) {
      const p = this.pt(e); this.mouse = p;
      const d = this.drag;
      if (d && d.type === 'anchor') { this.fib[d.key] = this.snap(p); this.emit('fibmove', this.fib); }
      else if (d && d.type === 'draw') this.draft.p2 = this.snap(p);
      else if (d && d.type === 'pan') { this.rightIndex = d.ri + (d.x - p.x) / this.barSpacing; this.follow = false; }
      else if (this.draft && this.draft.clickMode) this.draft.p2 = this.snap(p);
      if (!d) this.canvas.style.cursor = this.hitAnchor(p) ? 'move' : 'crosshair';
      const i = Math.round(this.idx(p.x));
      this.emit('hover', this.inPlot(p) && this.candles[i] ? this.candles[i] : null);
      this.requestRender();
    }
    onUp(e) {
      const d = this.drag; this.drag = null; this.canvas.style.cursor = 'crosshair';
      if (!d) return;
      if (d.type === 'draw') {
        const p = this.pt(e);
        if (Math.hypot(p.x - this.draft.start.x, p.y - this.draft.start.y) < 6) this.draft.clickMode = true; // click-click drawing
        else this.finishDraft();
      } else if (d.type === 'anchor') this.emit('fib', this.fib);
      this.requestRender();
    }
    finishDraft() {
      const { p1, p2 } = this.draft; this.draft = null; this.drag = null;
      if (p1.i !== p2.i || p1.price !== p2.price) { this.fib = { p1, p2 }; this.emit('fib', this.fib); }
      this.setTool('cursor');
    }
    onWheel(e) { e.preventDefault(); const p = this.pt(e); this.zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, Math.min(p.x, this.pw)); }

    // ---- drawing ----
    render() {
      const ctx = this.ctx, W = this.w, H = this.h, pw = this.pw, ph = this.ph;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      if (!this.candles.length) return;
      this.computeScale();
      const pStep = niceStep((this.pMax - this.pMin) / Math.max(2, ph / 58));
      const prices = []; for (let p = Math.ceil(this.pMin / pStep) * pStep; p <= this.pMax; p += pStep) prices.push(p);
      const times = this.timeTicks();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
      prices.forEach((p) => { const y = Math.round(this.y(p)) + 0.5; ctx.moveTo(0, y); ctx.lineTo(pw, y); });
      times.forEach((t) => { const x = Math.round(t.x) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, ph); });
      ctx.stroke();

      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.font = '600 46px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.symbol + ', 1', pw / 2, ph / 2); ctx.restore();

      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
      this.drawSeparators(); this.drawZones(); this.drawLevels(); this.drawTrade(); this.drawCandles(); this.drawFib(); this.drawMarkers();
      this.drawLastPriceLine(); this.drawCrosshairLines();
      ctx.restore();

      // axes
      ctx.fillStyle = C.bg; ctx.fillRect(pw, 0, AXIS_W, H); ctx.fillRect(0, ph, W, AXIS_H);
      ctx.strokeStyle = C.border; ctx.beginPath(); ctx.moveTo(pw + 0.5, 0); ctx.lineTo(pw + 0.5, ph); ctx.moveTo(0, ph + 0.5); ctx.lineTo(W, ph + 0.5); ctx.stroke();
      ctx.font = '11px ' + MONO; ctx.fillStyle = C.text; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      prices.forEach((p) => { const y = this.y(p); if (y > 6 && y < ph - 6) ctx.fillText(TA.fmt(p), pw + 8, y); });
      ctx.textAlign = 'center';
      times.forEach((t) => { if (t.x > 20 && t.x < pw - 20) ctx.fillText(t.label, t.x, ph + AXIS_H / 2); });
      this.drawAxisTags();
    }
    timeTicks() {
      const steps = [1, 2, 5, 10, 15, 30, 60, 120, 240];
      const step = steps.find((s) => s * this.barSpacing >= 76) || 240;
      const out = []; const a = Math.floor(this.idx(0)), b = Math.ceil(this.idx(this.pw));
      for (let i = Math.max(0, a); i <= b; i++) {
        const t = this.timeAt(i), prev = i > 0 ? this.timeAt(i - 1) : null;
        const gap = prev != null && t - prev > 60;
        if (!(t % (step * 60) === 0 || gap)) continue;
        const x = this.x(i), kept = out[out.length - 1];
        if (kept && x - kept.x < 64) { if (!gap) continue; out.pop(); } // session-gap labels win over regular ones
        out.push({ x, label: TA.fmtTime(t) });
      }
      return out;
    }
    drawCandles() {
      const ctx = this.ctx; const [a, b] = this.visibleRange();
      let bw = Math.max(1, Math.round(this.barSpacing * 0.72)); if (bw > 2 && bw % 2 === 0) bw -= 1;
      for (let i = a; i <= b; i++) {
        const k = this.candles[i], x = Math.round(this.x(i));
        ctx.fillStyle = k.close >= k.open ? C.up : C.down;
        const yh = Math.round(this.y(k.high)), yl = Math.round(this.y(k.low));
        ctx.fillRect(x, yh, 1, Math.max(1, yl - yh));
        const yo = this.y(k.open), yc = this.y(k.close), top = Math.round(Math.min(yo, yc));
        ctx.fillRect(x - (bw - 1) / 2, top, bw, Math.max(1, Math.round(Math.max(yo, yc)) - top));
      }
    }
    drawLastPriceLine() {
      const k = this.candles[this.candles.length - 1]; const ctx = this.ctx; const y = Math.round(this.y(k.close)) + 0.5;
      ctx.strokeStyle = k.close >= k.open ? C.up : C.down; ctx.setLineDash([1, 2]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.pw, y); ctx.stroke(); ctx.setLineDash([]);
    }
    drawSeparators() {
      const ctx = this.ctx;
      this.separators.forEach((s) => {
        const x = Math.round(this.x(s.i) - this.barSpacing / 2) + 0.5;
        if (s.i > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.ph); ctx.stroke(); ctx.setLineDash([]); }
        ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(s.label.toUpperCase(), Math.max(6, x + 6), 8);
      });
    }
    drawZones() {
      const ctx = this.ctx;
      const n = this.candles.length, closed = n && this.candles[n - 1].forming ? n - 1 : n;
      this.zones.forEach((z) => {
        if (z.showAfter != null && closed <= z.showAfter) return; // an FVG only exists once its 3rd candle has closed
        const x0 = Math.max(0, this.x(z.from) - this.barSpacing / 2), y0 = this.y(z.top), y1 = this.y(z.bottom);
        ctx.fillStyle = z.color; ctx.fillRect(x0, y0, this.pw - x0, y1 - y0);
        if (z.border) { ctx.strokeStyle = z.border; ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(this.pw - x0), Math.round(y1 - y0)); }
        if (z.label) { ctx.font = '700 10px Inter, system-ui, sans-serif'; ctx.fillStyle = z.border || '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(z.label, this.pw - 8, (y0 + y1) / 2); }
      });
    }
    drawLevels() {
      const ctx = this.ctx;
      this.levels.forEach((l) => {
        const y = Math.round(this.y(l.price)) + 0.5, x0 = Math.max(0, this.x(l.from || 0));
        ctx.strokeStyle = l.color; ctx.lineWidth = 1.5; ctx.setLineDash(l.dash || []);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(this.pw, y); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
        ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.fillStyle = l.color; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(l.label, this.pw - 8, y - 4);
      });
    }
    pill(text, x, y, bg, fg, align = 'center', font = '600 11px ' + MONO) {
      const ctx = this.ctx; ctx.font = font; const w = ctx.measureText(text).width + 12, h = 18;
      const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      ctx.fillStyle = bg; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(x0, y - h / 2, w, h, 3) : ctx.rect(x0, y - h / 2, w, h)); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + 6, y + 0.5);
    }
    drawTrade() {
      const t = this.trade; if (!t) return;
      const ctx = this.ctx, last = this.candles.length - 1;
      const endI = Math.max(t.entryIndex + 16, (t.exitIndex != null ? t.exitIndex : last) + 3);
      const x0 = this.x(t.entryIndex) - this.barSpacing / 2, x1 = this.x(endI);
      const yE = this.y(t.entry), yT = this.y(t.tp), yS = this.y(t.sl);
      ctx.fillStyle = 'rgba(8,153,129,0.20)'; ctx.fillRect(x0, Math.min(yE, yT), x1 - x0, Math.abs(yT - yE));
      ctx.fillStyle = 'rgba(242,54,69,0.20)'; ctx.fillRect(x0, Math.min(yE, yS), x1 - x0, Math.abs(yS - yE));
      ctx.strokeStyle = 'rgba(220,224,232,0.7)'; ctx.beginPath(); ctx.moveTo(x0, Math.round(yE) + 0.5); ctx.lineTo(x1, Math.round(yE) + 0.5); ctx.stroke();
      const cx = Math.max(70, Math.min(this.pw - 70, (x0 + x1) / 2)), up = t.dir === 'buy';
      const risk = Math.abs(t.entry - t.sl), reward = Math.abs(t.tp - t.entry);
      this.pill(`Target ${TA.fmt(t.tp)}  (${TA.fmt(reward)})`, cx, yT + (up ? -11 : 11), '#089981', '#fff');
      this.pill(`Stop ${TA.fmt(t.sl)}  (${TA.fmt(risk)})`, cx, yS + (up ? 11 : -11), '#f23645', '#fff');
      const price = t.exitPrice != null ? t.exitPrice : this.candles[last].close;
      const pl = TA.pnl(t, price), r = pl / risk;
      const txt = t.exitPrice != null
        ? `${up ? 'Long' : 'Short'} closed  ${pl >= 0 ? '+' : ''}${TA.fmt(pl)} pts  (${r >= 0 ? '+' : ''}${r.toFixed(1)}R)`
        : `${up ? 'Long' : 'Short'}  Open P/L ${pl >= 0 ? '+' : ''}${TA.fmt(pl)} pts  RR ${(reward / risk).toFixed(1)}`;
      this.pill(txt, cx, yE + (up ? 13 : -13), pl >= 0 ? '#0b5c4e' : '#7a1d26', '#fff');
      if (t.exitIndex != null) {
        const ex = this.x(t.exitIndex), ey = this.y(t.exitPrice);
        ctx.fillStyle = t.result === 'win' ? '#22c55e' : '#f23645'; ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    drawFib() {
      const f = this.draft || this.fib; if (!f || !f.p2) return;
      const ctx = this.ctx, { p1, p2 } = f;
      // Configured as "Don't extend": lines run between the anchors, but keep covering price as it develops
      // to the right of the swing so the retracement stays readable during the replay.
      const left = Math.min(p1.i, p2.i), right = Math.max(p1.i, p2.i, f === this.fib ? this.candles.length - 1 : -1);
      const xa = this.x(left), xb = this.x(right);
      ctx.font = '11px ' + MONO; ctx.textBaseline = 'middle';
      this.fibLevels.forEach((L) => {
        const price = TA.fibPrice(f, L.value), y = Math.round(this.y(price)) + 0.5;
        ctx.strokeStyle = L.color; ctx.lineWidth = L.red ? 1.4 : 1; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = L.color; const label = `${L.value} (${TA.fmt(price)})`;
        if (xa - ctx.measureText(label).width - 8 > 0) { ctx.textAlign = 'right'; ctx.fillText(label, xa - 6, y); }
        else { ctx.textAlign = 'left'; ctx.fillText(label, xa + 4, y - 7); }
      });
      [p1, p2].forEach((a) => {
        ctx.fillStyle = C.bg; ctx.strokeStyle = '#2962ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x(a.i), this.y(a.price), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
      });
    }
    drawMarkers() {
      const ctx = this.ctx;
      this.markers.forEach((m) => {
        const x = this.x(m.i), k = this.candles[m.i]; if (!k && m.price == null) return;
        const below = !!m.below, y = m.price != null ? this.y(m.price) : this.y(below ? k.low : k.high);
        const yy = below ? y + 16 : y - 16;
        if (m.text.length <= 2) { ctx.fillStyle = m.color; ctx.font = '700 12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.text, x, below ? y + 10 : y - 10); return; }
        this.pill(m.text, x, yy, m.color, '#fff', 'center', '700 10px Inter, system-ui, sans-serif');
        ctx.fillStyle = m.color; ctx.beginPath(); ctx.moveTo(x - 4, below ? yy - 9 : yy + 9); ctx.lineTo(x + 4, below ? yy - 9 : yy + 9); ctx.lineTo(x, below ? y + 3 : y - 3); ctx.fill();
      });
    }
    drawCrosshairLines() {
      const m = this.mouse; if (!m || !this.inPlot(m)) return;
      const ctx = this.ctx, x = Math.round(this.x(Math.round(this.idx(m.x)))) + 0.5, y = Math.round(m.y) + 0.5;
      ctx.strokeStyle = C.cross; ctx.setLineDash([5, 4]); ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, this.ph); ctx.moveTo(0, y); ctx.lineTo(this.pw, y); ctx.stroke(); ctx.setLineDash([]);
    }
    drawAxisTags() {
      const pw = this.pw, ax = pw + 2;
      const tag = (price, bg, fg = '#fff') => { const y = this.y(price); if (y < 0 || y > this.ph) return; this.pill(TA.fmt(price), ax, y, bg, fg, 'left'); };
      this.levels.forEach((l) => tag(l.price, l.color, '#111'));
      if (this.trade) { tag(this.trade.tp, '#089981'); tag(this.trade.sl, '#f23645'); tag(this.trade.entry, '#5d6370'); }
      const k = this.candles[this.candles.length - 1]; tag(k.close, k.close >= k.open ? C.up : C.down);
      const m = this.mouse;
      if (m && this.inPlot(m)) {
        tag(Math.round(this.price(m.y) / this.tick) * this.tick, C.tag);
        const i = Math.round(this.idx(m.x));
        this.pill(TA.fmtTime(this.timeAt(i)), this.x(i), this.ph + AXIS_H / 2, C.tag, '#fff');
      }
    }
  }
  TA.TradingChart = TradingChart;
})(window.TA);
