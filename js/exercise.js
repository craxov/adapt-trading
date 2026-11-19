// Exercise pages. A shared frame (chart + toolbar + playback bar + side panel) drives both modules.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const esc = TA.esc, icon = (n) => TA.icon(n);
  const SPEEDS = [0.5, 1, 2, 4];

  function frame(root, { crumb, title, symbol, tick }) {
    root.innerHTML = `<div class="ex">
      <div class="ex-top"><a class="crumb" href="#/">${icon('back')} ${esc(crumb)}</a><h1>${esc(title)}</h1><div class="ex-score" id="score"></div></div>
      <div class="ex-main">
        <div class="ex-chart">
          <div class="chart-head"><span class="sym">${esc(symbol)}</span><span class="tf">1m</span><span class="legend" id="legend"></span><span class="replay-badge">${icon('reset')} Replay</span></div>
          <div class="chart-body">
            <div class="toolbar" role="toolbar" aria-label="Drawing tools">
              <button data-t="cursor" title="Cursor">${icon('cursor')}</button>
              <button data-t="fib" title="Fib Retracement">${icon('fib')}</button>
              <button data-a="magnet" title="Magnet: snap to candle high/low" class="on">${icon('magnet')}</button>
              <button data-a="delete" title="Delete drawing (Del)">${icon('trash')}</button>
              <i class="tb-sep"></i>
              <button data-a="zin" title="Zoom in">${icon('plus')}</button>
              <button data-a="zout" title="Zoom out">${icon('minus')}</button>
              <button data-a="reset" title="Reset view">${icon('reset')}</button>
            </div>
            <div class="chart-area" id="chart"></div>
          </div>
          <div class="playbar">
            <button class="pb-play" id="pbPlay" disabled aria-label="Play">${icon('play')}</button>
            <div class="pb-speed" id="pbSpeed">${SPEEDS.map((s) => `<button data-s="${s}" class="${s === 1 ? 'on' : ''}">${s}×</button>`).join('')}</div>
            <div class="pb-progress"><div class="bar sm"><i id="pbBar"></i></div><span id="pbText">Bar —</span></div>
            <span class="pb-status" id="pbStatus"><i></i>Ready</span>
          </div>
        </div>
        <aside class="ex-panel" id="panel"></aside>
      </div></div>`;
    const $ = (s) => root.querySelector(s);
    const chart = new TA.TradingChart($('#chart'), { symbol, tick });
    const F = { root, chart, $, panel: $('#panel'), speed: 1, pb: null, awaiting: false };

    const legend = (k) => {
      if (!k) k = chart.candles[chart.candles.length - 1];
      if (!k) { $('#legend').innerHTML = ''; return; }
      const cls = k.close >= k.open ? 'up' : 'down';
      $('#legend').innerHTML = ['O', 'H', 'L', 'C'].map((l, i) => `<span>${l}<b class="${cls}">${TA.fmt([k.open, k.high, k.low, k.close][i])}</b></span>`).join('');
    };
    chart.on('hover', legend);
    const tools = root.querySelectorAll('.toolbar [data-t]');
    const syncTools = () => tools.forEach((b) => b.classList.toggle('on', b.dataset.t === chart.tool));
    chart.on('tool', syncTools); syncTools();
    root.querySelector('.toolbar').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.t) { if (chart.locked && b.dataset.t === 'fib') return TA.toast(chart.lockMsg || 'Drawing is locked right now.', 'info'); chart.setTool(chart.tool === b.dataset.t ? 'cursor' : b.dataset.t); }
      const a = b.dataset.a;
      if (a === 'magnet') { chart.magnet = !chart.magnet; b.classList.toggle('on', chart.magnet); }
      if (a === 'delete') chart.locked && chart.fib ? TA.toast(chart.lockMsg, 'info') : chart.deleteFib();
      if (a === 'zin') chart.zoom(1.25); if (a === 'zout') chart.zoom(0.8); if (a === 'reset') chart.resetView();
    });

    $('#pbSpeed').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      F.speed = +b.dataset.s; if (F.pb) F.pb.setSpeed(F.speed);
      $('#pbSpeed').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#pbPlay').onclick = () => F.pb && !F.awaiting && F.pb.toggle();

    F.sync = () => {
      const pb = F.pb, playBtn = $('#pbPlay'), st = $('#pbStatus');
      legend();
      if (!pb) { playBtn.disabled = true; st.className = 'pb-status'; st.innerHTML = '<i></i>Waiting for your drawing'; return; }
      const total = pb.source.length, shown = pb.revealed;
      $('#pbBar').style.width = (shown / total) * 100 + '%';
      $('#pbText').textContent = `Bar ${shown} / ${total}`;
      playBtn.disabled = pb.done || F.awaiting;
      playBtn.innerHTML = icon(pb.playing ? 'pause' : 'play');
      const [cls, txt] = F.awaiting ? ['wait', 'Awaiting your decision'] : pb.done ? ['', 'Replay complete'] : pb.playing ? ['live', 'Live replay'] : ['', 'Paused'];
      st.className = 'pb-status ' + cls; st.innerHTML = `<i></i>${txt}`;
    };
    F.bind = (pb) => { if (F.pb && F.pb !== pb) F.pb.destroy(); F.pb = pb; pb.setSpeed(F.speed); pb.on('state', F.sync).on('candle', F.sync); F.sync(); };
    F.resetChart = (sc) => {
      Object.assign(chart, { levels: sc.levels || [], zones: sc.zones || [], separators: sc.separators || [], markers: (sc.markers || []).slice(), trade: null, fib: null, draft: null, symbol: sc.symbol });
      chart.setTool('cursor'); chart.resetView(sc.candles.length - 1);
    };

    const onKey = (e) => {
      if (e.target.closest('input,textarea')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && chart.fib && !chart.locked) { chart.deleteFib(); e.preventDefault(); }
      if (e.key === 'Escape') chart.setTool('cursor');
      if (e.key === ' ' && !e.target.closest('button') && F.pb && !F.awaiting) { F.pb.toggle(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    F.destroy = () => { window.removeEventListener('keydown', onKey); if (F.pb) F.pb.destroy(); chart.destroy(); };
    return F;
  }

  // Decision panel: BUY / SELL / WAIT. Never reveals which one is right before the choice.
  function askHTML(dp) {
    return `<div class="decision pop"><div class="decision-head"><span class="pulse"></span>Decision point</div>
      <h3>${esc(dp.question)}</h3>
      <div class="decision-btns">
        <button class="dbtn buy" data-c="buy"><b>BUY</b><small>Enter long</small></button>
        <button class="dbtn sell" data-c="sell"><b>SELL</b><small>Enter short</small></button>
        <button class="dbtn wait" data-c="wait"><b>WAIT</b><small>No trade yet</small></button>
      </div></div>`;
  }
  function tradeHTML(t) {
    const risk = Math.abs(t.entry - t.sl), reward = Math.abs(t.tp - t.entry);
    return `<div class="trade-card ${t.dir}"><div class="tc-head"><b>${t.dir === 'buy' ? 'Long' : 'Short'} position</b><span id="tcState">${t.result ? (t.result === 'win' ? 'Target hit' : 'Stopped out') : 'Open'}</span></div>
      <div class="tc-grid"><span>Entry</span><b>${TA.fmt(t.entry)}</b><span>Stop</span><b class="down">${TA.fmt(t.sl)}</b><span>Target</span><b class="up">${TA.fmt(t.tp)}</b><span>Risk : Reward</span><b>1 : ${(reward / risk).toFixed(1)}</b></div></div>`;
  }
  const verdict = (ok, text) => `<div class="fb ${ok ? 'fb-ok' : 'fb-bad'} pop">${ok ? icon('check') : '<span class="x">✕</span>'}<span>${esc(text)}</span></div>`;

  // ---------------- Fibonacci exercise ----------------
  TA.views.fibExercise = function (root) {
    const sc = TA.SCENARIOS.fibonacci;
    const F = frame(root, { crumb: 'Fibonacci', title: 'Fibonacci Replay', symbol: sc.symbol, tick: sc.tick });
    const { chart, panel } = F;
    let phase, runner, log;

    const steps = (s) => `<ol class="checklist">
      <li class="${s >= 1 ? 'done' : 'cur'}"><span>${icon('check')}</span>Select the Fibonacci tool</li>
      <li class="${s >= 2 ? 'done' : s === 1 ? 'cur' : ''}"><span>${icon('check')}</span>Click the swing low</li>
      <li class="${s >= 3 ? 'done' : s === 2 ? 'cur' : ''}"><span>${icon('check')}</span>Drag or click to the swing high</li></ol>`;

    function start() {
      if (runner) runner.destroy(); runner = null; log = [];
      F.resetChart(sc); chart.locked = true; chart.lockMsg = 'Wait for the impulse to finish forming.'; phase = 'intro'; F.awaiting = false;
      const intro = new TA.Playback({ source: sc.candles, chart, from: sc.historyEnd + 1, to: sc.introEnd, baseMs: 450, tick: sc.tick });
      F.bind(intro); intro.setSpeed(1);
      intro.on('end', enterDraw);
      panel.innerHTML = `<div class="panel-card"><p class="eyebrow">Step 1 of 3 · Read the move</p><h2>An impulsive movement is forming.</h2>
        <p class="muted">Identify the swing low and swing high, then draw your Fibonacci retracement.</p><div class="forming"><span class="pulse"></span>Candles forming…</div></div>`;
      F.$('#score').innerHTML = '';
      intro.play();
    }
    function enterDraw() {
      phase = 'draw'; chart.locked = false; F.pb = null; F.sync();
      F.$('.toolbar [data-t="fib"]').classList.add('nudge');
      renderDraw(null);
    }
    function renderDraw(res) {
      const s = chart.fib ? 3 : chart.tool === 'fib' ? 1 : 0;
      panel.innerHTML = `<div class="panel-card"><p class="eyebrow">Step 2 of 3 · Draw</p><h2>Draw your Fibonacci retracement</h2>
        <p class="muted">An impulsive movement has formed. Identify the swing low and swing high, then draw your Fibonacci retracement.</p>
        ${steps(s)}
        ${res && !res.ok ? verdict(false, res.msg) : ''}
        <div class="panel-actions"><button class="btn btn-ghost btn-sm" id="hint">Show hint</button>${chart.fib ? '<button class="btn btn-ghost btn-sm" id="redo">Redraw</button>' : ''}</div>
        <p class="fine">Tip: drag the round anchors to adjust. Press Del to delete. Magnet snaps to candle highs and lows.</p></div>`;
      panel.querySelector('#hint').onclick = () => {
        chart.markers = [{ i: sc.swing.low.i, text: 'Swing low', color: '#2962ff', below: true }, { i: sc.swing.high.i, text: 'Swing high', color: '#2962ff' }];
        chart.requestRender();
      };
      const redo = panel.querySelector('#redo'); if (redo) redo.onclick = () => { chart.deleteFib(); chart.setTool('fib'); };
    }
    function checkFib(f) {
      const near = (a, s) => Math.abs(a.price - s.price) <= 4 && Math.abs(a.i - s.i) <= 3;
      const { low, high } = sc.swing;
      if (near(f.p1, low) && near(f.p2, high)) return { ok: true };
      if (near(f.p1, high) && near(f.p2, low)) return { ok: false, msg: 'Reversed. For a bullish impulse, draw from the swing low to the swing high.' };
      if (!near(f.p1, low)) return { ok: false, msg: 'Anchor 1 should sit on the swing low, where the impulse started. Drag it to adjust.' };
      return { ok: false, msg: 'Anchor 2 should sit on the swing high, where the impulse ended. Drag it to adjust.' };
    }
    function renderReady() {
      const f = chart.fib;
      const rows = chart.fibLevels.map((L) => `<div class="lv ${L.red ? 'red' : ''}"><span>${L.value}</span><b>${TA.fmt(TA.fibPrice(f, L.value))}</b></div>`).join('');
      panel.innerHTML = `<div class="panel-card"><p class="eyebrow">Step 2 of 3 · Draw</p>
        ${verdict(true, 'Fibonacci placed correctly, from the swing low to the swing high.')}
        <div class="lv-table">${rows}</div>
        <p class="eyebrow" style="margin-top:18px">Step 3 of 3 · Trade the replay</p>
        <p class="muted">Press play. Candles will appear one by one. The replay stops when you need to make a decision.</p>
        <button class="btn btn-primary btn-lg btn-block" id="go">${icon('play')} Play replay</button></div>`;
      panel.querySelector('#go').onclick = play;
    }
    chart.on('tool', () => { if (phase === 'draw') renderDraw(null); });
    const onFib = (f) => {
      if (phase !== 'draw' && phase !== 'ready') return;
      F.$('.toolbar [data-t="fib"]').classList.remove('nudge');
      if (!f) { phase = 'draw'; return renderDraw(null); }
      const res = checkFib(f);
      if (res.ok) { phase = 'ready'; chart.markers = []; TA.achieve('firstFib'); renderReady(); }
      else { phase = 'draw'; renderDraw(res); }
    };
    chart.on('fib', onFib);

    function play() {
      phase = 'play'; chart.locked = true; chart.lockMsg = 'Your Fibonacci is locked during the replay. Retry to redraw.'; chart.setTool('cursor');
      runner = new TA.Runner({ scenario: sc, chart, from: sc.introEnd + 1, ui });
      F.bind(runner.pb);
      watching('Watch price pull back into your levels.');
      runner.pb.play();
    }
    const watching = (msg, extra = '') => {
      panel.innerHTML = `<div class="panel-card"><p class="eyebrow">Step 3 of 3 · Trade the replay</p><h2>Replay running</h2><p class="muted">${esc(msg)}</p>${extra}<div class="dlog">${log.join('')}</div></div>`;
    };
    const ui = {
      tick: () => F.sync(),
      ask(dp, cb) {
        F.awaiting = true; F.sync();
        panel.innerHTML = `<div class="panel-card">${askHTML(dp)}<div class="dlog">${log.join('')}</div></div>`;
        panel.querySelectorAll('.dbtn').forEach((b) => (b.onclick = () => { F.awaiting = false; cb(b.dataset.c); }));
      },
      decided(dp, choice, correct) {
        const n = log.length + 1;
        if (choice === 'wait' && correct) {
          log.push(`<div class="dl ok">${icon('check')}<span>Decision ${n}: WAIT</span></div>`);
          TA.toast(`${icon('check')} Good decision. You waited for confirmation.`, 'ok'); TA.achieve('patient');
          watching('Keep watching. Price is still developing.');
        } else {
          log.push(`<div class="dl">${icon('target')}<span>Decision ${n}: ${choice.toUpperCase()}</span></div>`);
          watching(choice === 'wait' ? 'You are flat. Watch how price develops.' : 'Position open. Watch the trade play out.', runner.trade ? tradeHTML(runner.trade) : '');
        }
        F.sync();
      },
      tradeClosed(t) { const el = panel.querySelector('.trade-card'); if (el) el.outerHTML = tradeHTML(t); },
      finish: results,
    };
    function results(sum) {
      F.sync();
      TA.progress.recordExercise('fibExercise', { correct: sum.correct, total: sum.total, passed: sum.passed });
      if (sum.passed) TA.achieve('ric');
      TA.renderNav(location.hash);
      const t = sum.trade, pl = t ? TA.pnl(t, t.exitPrice) : 0;
      const cut = sum.results.length < sum.total;
      panel.innerHTML = `<div class="panel-card result ${sum.passed ? 'pass' : 'fail'} pop">
        <div class="result-badge">${sum.passed ? icon('star') : icon('reset')}</div>
        <h2>${sum.passed ? 'Exercise passed' : 'Not passed yet'}</h2>
        <div class="result-stats"><div><b>${sum.correct}</b><span>Correct</span></div><div><b>${sum.incorrect}</b><span>Incorrect</span></div>
          <div><b class="${pl >= 0 ? 'up' : 'down'}">${t ? (pl >= 0 ? '+' : '') + TA.fmt(pl) : '—'}</b><span>Trade pts</span></div></div>
        ${sum.results.map((r) => verdict(r.correct, r.dp.feedback[r.choice])).join('')}
        ${cut ? '<p class="fine">The replay ended after this decision. Retry to reach the next setup.</p>' : ''}
        <div class="panel-actions"><button class="btn btn-ghost" id="retry">${icon('reset')} Retry</button>
        <a class="btn btn-primary" href="${sum.passed ? '#/liquidity' : '#/fibonacci'}">${sum.passed ? 'Continue to Liquidity' : 'Review lesson'} ${icon('arrow')}</a></div></div>`;
      F.$('#score').innerHTML = `<span class="pill ${sum.passed ? 'pill-done' : ''}">${sum.correct}/${sum.total} correct</span>`;
      panel.querySelector('#retry').onclick = start;
    }

    start();
    return () => { if (runner) runner.destroy(); F.destroy(); };
  };

  // ---------------- Liquidity exercise ----------------
  TA.views.liqExercise = function (root) {
    const ids = TA.LIQUIDITY_SET, set = ids.map((id) => TA.SCENARIOS[id]);
    const F = frame(root, { crumb: 'Liquidity', title: 'Liquidity Sweep Replay', symbol: set[0].symbol, tick: set[0].tick });
    const { chart, panel } = F;
    const best = set.map(() => null); // null = not tried, true/false = best result
    let si = 0, runner;

    const stepper = () => `<div class="stepper">${set.map((s, i) => `<button data-i="${i}" class="st ${i === si ? 'cur' : ''} ${best[i] === true ? 'ok' : best[i] === false ? 'bad' : ''}">${best[i] === true ? icon('check') : i + 1}</button>`).join('')}</div>`;
    const levelLegend = (sc) => `<div class="lv-legend">${sc.levels.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>`;
    const wireStepper = () => panel.querySelectorAll('.stepper .st').forEach((b) => (b.onclick = () => load(+b.dataset.i)));
    const score = () => { F.$('#score').innerHTML = `<span class="pill">${best.filter((b) => b === true).length}/${set.length} correct</span>`; };

    function load(i) {
      si = i; if (runner) runner.destroy();
      const sc = set[si]; F.resetChart(sc); F.awaiting = false;
      runner = new TA.Runner({ scenario: sc, chart, from: sc.historyEnd + 1, ui });
      F.bind(runner.pb);
      panel.innerHTML = `<div class="panel-card">${stepper()}<p class="eyebrow">Setup ${si + 1} of ${set.length}</p><h2>${esc(sc.title)}</h2>
        <p class="muted">${esc(sc.intro)}</p>${levelLegend(sc)}
        <div class="rule-mini"><b>Sweep confirmation (simplified)</b><span>Candle 1 closes beyond the level, candle 2 closes back inside. Then wait for price to retest into the FVG it leaves.</span></div>
        <button class="btn btn-primary btn-lg btn-block" id="go">${icon('play')} Play replay</button></div>`;
      wireStepper(); score();
      panel.querySelector('#go').onclick = () => { watching(); runner.pb.play(); };
    }
    const watching = (extra = '') => {
      const sc = set[si];
      panel.innerHTML = `<div class="panel-card">${stepper()}<p class="eyebrow">Setup ${si + 1} of ${set.length} · ${esc(sc.title)}</p><h2>Replay running</h2>
        <p class="muted">Watch the candles close around the level.</p>${levelLegend(sc)}${extra}</div>`;
      wireStepper();
    };
    const ui = {
      tick: () => F.sync(),
      ask(dp, cb) {
        F.awaiting = true; F.sync();
        panel.innerHTML = `<div class="panel-card">${stepper()}${askHTML(dp)}</div>`;
        wireStepper();
        panel.querySelectorAll('.dbtn').forEach((b) => (b.onclick = () => { F.awaiting = false; cb(b.dataset.c); }));
      },
      decided(dp, choice) {
        watching(`<div class="dl">${icon('target')}<span>Your decision: ${choice.toUpperCase()}</span></div>${runner.trade ? tradeHTML(runner.trade) : ''}`);
        F.sync();
      },
      tradeClosed(t) { const el = panel.querySelector('.trade-card'); if (el) el.outerHTML = tradeHTML(t); },
      finish(sum) {
        F.sync();
        const r = sum.results[0], ok = r.correct;
        best[si] = best[si] === true || ok;
        if (ok && r.choice === 'wait') TA.achieve('patient');
        const right = best.filter((b) => b === true).length, done = right === set.length;
        const allTried = best.every((b) => b !== null);
        // Next = first setup after this one (wrapping) not yet answered correctly; passed setups are never replayed.
        const order = set.map((_, k) => (si + 1 + k) % set.length), nextIdx = order.find((k) => best[k] !== true);
        if (allTried) {
          TA.progress.recordExercise('liqExercise', { correct: right, total: set.length, passed: right === set.length });
          if (right === set.length) TA.achieve('sweep');
          TA.renderNav(location.hash);
        }
        score();
        const t = sum.trade, pl = t ? TA.pnl(t, t.exitPrice) : null;
        const nextLabel = nextIdx === si ? '' : best[nextIdx] === null ? 'Next setup' : `Retry setup ${nextIdx + 1}`;
        panel.innerHTML = `<div class="panel-card">${stepper()}<p class="eyebrow">Setup ${si + 1} of ${set.length} · ${esc(set[si].title)}</p>
          ${verdict(ok, r.dp.feedback[r.choice])}
          ${t ? `<div class="mini-result">Trade result <b class="${pl >= 0 ? 'up' : 'down'}">${pl >= 0 ? '+' : ''}${TA.fmt(pl)} pts</b></div>` : ''}
          ${allTried ? `<div class="summary pop"><b>${right}/${set.length} setups correct</b><span>${done ? 'Liquidity exercise complete.' : 'Retry the setups you missed to complete the exercise.'}</span></div>` : ''}
          <div class="panel-actions">${!ok ? `<button class="btn btn-ghost" id="retry">${icon('reset')} Retry setup</button>` : ''}
            ${done ? `<a class="btn btn-primary" href="#/">Back to dashboard ${icon('arrow')}</a>`
              : nextLabel ? `<button class="btn btn-primary" id="next">${nextLabel} ${icon('arrow')}</button>` : ''}</div></div>`;
        wireStepper();
        const rb = panel.querySelector('#retry'); if (rb) rb.onclick = () => load(si);
        const nb = panel.querySelector('#next'); if (nb) nb.onclick = () => load(nextIdx);
      },
    };
    load(0);
    return () => { if (runner) runner.destroy(); F.destroy(); };
  };
})(window.TA);
