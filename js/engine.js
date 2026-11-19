// Candle playback (progressive reveal, the current candle forms tick by tick) and the decision runner
// shared by every exercise. Future candles live only in `source` and are never handed to the chart.
window.TA = window.TA || {};
(function (TA) {
  'use strict';

  // Partial candle at progress t∈[0,1]: open → first extreme → second extreme → close.
  function forming(k, t, tick) {
    const up = k.close >= k.open, a = up ? k.low : k.high, b = up ? k.high : k.low;
    const d1 = Math.abs(k.open - a), d2 = Math.abs(b - a), d3 = Math.abs(k.close - b), tot = d1 + d2 + d3 || 1;
    const s = t * tot; let p, hi, lo;
    if (s <= d1) { p = k.open + (a - k.open) * (d1 ? s / d1 : 1); hi = Math.max(k.open, p); lo = Math.min(k.open, p); }
    else if (s <= d1 + d2) { p = a + (b - a) * ((s - d1) / (d2 || 1)); hi = Math.max(k.open, a, p); lo = Math.min(k.open, a, p); }
    else { p = b + (k.close - b) * ((s - d1 - d2) / (d3 || 1)); hi = k.high; lo = k.low; }
    p = Math.round(p / tick) * tick;
    return { time: k.time, open: k.open, high: Math.max(hi, p), low: Math.min(lo, p), close: p, volume: Math.round(k.volume * t), forming: true };
  }

  class Playback {
    constructor({ source, chart, from, to, baseMs = 2500, tick = 0.25, pauseAt = [], slowNear = [] }) {
      Object.assign(this, { source, chart, baseMs, tick });
      this.view = source.slice(0, from); this.next = from; this.to = to != null ? to : source.length - 1;
      this.pauseAt = new Set(pauseAt); this.slowNear = slowNear;
      this.playing = false; this.done = false; this.speed = 1; this.t = 0; this.hasForming = false; this.listeners = {};
      chart.setCandles(this.view);
    }
    on(e, f) { (this.listeners[e] = this.listeners[e] || []).push(f); return this; }
    emit(e, ...a) { (this.listeners[e] || []).forEach((f) => f(...a)); }
    get revealed() { return this.next; }
    play() {
      if (this.done || this.playing) return;
      this.playing = true; this.last = performance.now(); this.emit('state');
      this.raf = requestAnimationFrame(this.loop);
    }
    pause() { if (!this.playing) return; this.playing = false; cancelAnimationFrame(this.raf); this.emit('state'); }
    toggle() { this.playing ? this.pause() : this.play(); }
    setSpeed(s) { this.speed = s; this.emit('state'); }
    destroy() { this.playing = false; cancelAnimationFrame(this.raf); this.listeners = {}; }
    loop = (now) => {
      if (!this.playing) return;
      const dt = Math.min(250, now - this.last); this.last = now;
      const slow = this.slowNear.some((i) => i >= this.next && i - this.next < 3) ? 1.4 : 1;
      this.t += dt / ((this.baseMs / this.speed) * slow);
      const k = this.source[this.next];
      if (this.t >= 1) {
        this.t = 0;
        if (this.hasForming) this.view.pop();
        this.view.push(Object.assign({}, k)); this.hasForming = false;
        const idx = this.next++; this.chart.update();
        this.emit('candle', idx);
        if (this.next > this.to || this.next >= this.source.length) { this.playing = false; this.done = true; this.emit('state'); this.emit('end'); return; }
        if (this.pauseAt.has(idx)) { this.pauseAt.delete(idx); this.playing = false; this.emit('state'); this.emit('pause', idx); return; }
      } else {
        const part = forming(k, this.t, this.tick);
        if (this.hasForming) this.view[this.view.length - 1] = part; else { this.view.push(part); this.hasForming = true; }
        this.chart.update();
      }
      this.raf = requestAnimationFrame(this.loop);
    };
  }
  TA.Playback = Playback;

  // Plays a scenario's hidden candles, stops at decision points, opens/resolves trades, reports the result.
  // ui hooks: ask(dp, cb), decided(dp, choice, correct), tradeClosed(trade), finish(summary), tick(pb)
  class Runner {
    constructor({ scenario, chart, ui, from }) {
      this.s = scenario; this.chart = chart; this.ui = ui; this.results = []; this.trade = null;
      const ats = scenario.decisions.map((d) => d.at);
      this.pb = new Playback({ source: scenario.candles, chart, from, tick: scenario.tick, pauseAt: ats, slowNear: ats });
      this.pb.on('pause', (i) => this.onPause(i)).on('candle', (i) => this.onCandle(i)).on('end', () => this.finish()).on('state', () => ui.tick(this.pb));
    }
    onPause(i) {
      const dp = this.s.decisions.find((d) => d.at === i);
      this.ui.ask(dp, (choice) => this.decide(dp, choice));
    }
    decide(dp, choice) {
      const correct = choice === dp.correct;
      this.results.push({ dp, choice, correct });
      TA.progress.logDecision({ sid: this.s.id, dp: this.s.decisions.indexOf(dp), choice, correct });
      const last = this.s.decisions[this.s.decisions.length - 1] === dp;
      if (choice !== 'wait') {
        const k = this.s.candles[dp.at];
        this.trade = Object.assign({ dir: choice, entry: k.close, entryIndex: dp.at }, dp.trades[choice]);
        this.chart.trade = this.trade;
        this.chart.markers.push({ i: dp.at, text: choice.toUpperCase(), color: choice === 'buy' ? '#089981' : '#f23645', below: choice === 'buy' });
      } else {
        this.chart.markers.push({ i: dp.at, text: 'WAIT', color: '#5d6370', below: false });
      }
      if (!(choice === 'wait' && correct && !last)) this.pb.pauseAt.clear(); // scenario now runs to its outcome
      this.ui.decided(dp, choice, correct);
      this.chart.requestRender();
      this.pb.play();
    }
    onCandle(i) {
      const t = this.trade;
      if (t && t.exitIndex == null && i > t.entryIndex) {
        const hit = TA.tradeHit(t, this.s.candles[i]);
        if (hit) {
          Object.assign(t, { exitIndex: i, exitPrice: hit === 'sl' ? t.sl : t.tp, result: hit === 'tp' ? 'win' : 'loss' });
          this.pb.to = Math.min(this.s.candles.length - 1, i + 3); // show a few candles after the outcome, then stop
          this.ui.tradeClosed(t);
        }
      }
      this.ui.tick(this.pb);
    }
    finish() {
      const t = this.trade;
      if (t && t.exitIndex == null) { const k = this.pb.view[this.pb.view.length - 1]; Object.assign(t, { exitIndex: this.pb.next - 1, exitPrice: k.close, result: TA.pnl(t, k.close) >= 0 ? 'win' : 'loss' }); }
      const correct = this.results.filter((r) => r.correct).length;
      this.ui.finish({ results: this.results, correct, incorrect: this.results.length - correct, total: this.s.decisions.length, passed: correct === this.s.decisions.length, trade: t });
    }
    destroy() { this.pb.destroy(); }
  }
  TA.Runner = Runner;
})(window.TA);
