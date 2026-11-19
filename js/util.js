// Shared helpers: seeded RNG, candle builder, trade maths, progress storage.
window.TA = window.TA || {};
(function (TA) {
  'use strict';

  TA.APP_NAME = 'Adapt Trading';

  TA.rng = function (seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  TA.clamp = clamp;
  TA.fmt = (p, d = 2) => (p == null || isNaN(p) ? '—' : Number(p).toFixed(d));
  TA.fmtTime = (t) => new Date(t * 1000).toISOString().slice(11, 16);
  TA.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Builds 1-minute OHLC candles from short scripted segments so every scenario is deterministic.
  class Builder {
    constructor({ start, time, tick = 0.25, seed = 1 }) {
      this.tick = tick; this.rand = TA.rng(seed); this.t = time; this.last = start;
      this.candles = []; this.marks = {};
    }
    r(p) { return Math.round(p / this.tick) * this.tick; }
    ohlc(o, h, l, c) {
      const k = { time: this.t, open: this.r(o), high: this.r(h), low: this.r(l), close: this.r(c) };
      if (k.high < Math.max(k.open, k.close) || k.low > Math.min(k.open, k.close)) throw new Error('Invalid candle #' + this.candles.length);
      k.volume = Math.round(120 + Math.abs(k.close - k.open) * 45 + (k.high - k.low) * 18 + this.rand() * 260);
      this.candles.push(k); this.t += 60; this.last = k.close;
      return this;
    }
    // Drift from the last close to `to` over n candles; wicks/closes stay inside [min, max].
    walk(to, n, { vol = 3, wick = 0.8, min = -Infinity, max = Infinity } = {}) {
      const from = this.last;
      for (let i = 1; i <= n; i++) {
        const o = this.last;
        const c = clamp(i === n ? to : from + (to - from) * (i / n) + (this.rand() - 0.5) * 2 * vol, min, max);
        const top = Math.max(o, c), bot = Math.min(o, c);
        const h = Math.max(top, Math.min(max, top + this.rand() * vol * wick));
        const l = Math.min(bot, Math.max(min, bot - this.rand() * vol * wick));
        this.ohlc(o, h, l, c);
      }
      return this;
    }
    jump(price) { this.last = price; return this; }          // price gap (new day / new week open)
    skip(minutes) { this.t += minutes * 60; return this; }    // time gap between sessions
    mark(name) { this.marks[name] = this.candles.length - 1; return this; }
    get n() { return this.candles.length; }
  }
  TA.Builder = Builder;

  // ---- Trade maths (shared by the live exercise and the self-check) ----
  // SL is checked first when a candle touches both: the conservative assumption.
  TA.tradeHit = (tr, k) => tr.dir === 'buy'
    ? (k.low <= tr.sl ? 'sl' : k.high >= tr.tp ? 'tp' : null)
    : (k.high >= tr.sl ? 'sl' : k.low <= tr.tp ? 'tp' : null);
  TA.pnl = (tr, price) => (tr.dir === 'buy' ? price - tr.entry : tr.entry - price);
  TA.simulateTrade = (candles, tr) => {
    for (let i = tr.entryIndex + 1; i < candles.length; i++) {
      const hit = TA.tradeHit(tr, candles[i]);
      if (hit) return { hit, index: i, price: hit === 'sl' ? tr.sl : tr.tp };
    }
    return { hit: null, index: candles.length - 1, price: candles[candles.length - 1].close };
  };

  // ---- Local progress (demo only) ----
  const KEY = 'wickwise.progress.v1';
  const blank = () => ({ lessons: {}, exercises: {}, achievements: [] });
  TA.progress = {
    get() {
      try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return blank(); }
    },
    save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode: progress just won't persist */ } },
    completeLesson(id) { const p = this.get(); if (!p.lessons[id]) { p.lessons[id] = true; this.save(p); } },
    // Keep the best attempt so retries never double-count points.
    recordExercise(id, { correct, total, passed }) {
      const p = this.get(); const old = p.exercises[id] || { best: 0, passed: false, attempts: 0 };
      p.exercises[id] = { best: Math.max(old.best, correct), total, passed: old.passed || passed, attempts: old.attempts + 1 };
      this.save(p);
    },
    // Every decision made on this device, for the mentor view's live feed.
    logDecision(d) {
      const p = this.get(); p.decisions = (p.decisions || []).concat([Object.assign({ t: Date.now() }, d)]).slice(-200); this.save(p);
    },
    unlock(id) { const p = this.get(); if (!p.achievements.includes(id)) { p.achievements.push(id); this.save(p); return true; } return false; },
    xp(p = this.get()) {
      return Object.keys(p.lessons).length * 50 + Object.values(p.exercises).reduce((s, e) => s + e.best * 100 + (e.passed ? 150 : 0), 0);
    },
    reset() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
  };
})(window.TA);
