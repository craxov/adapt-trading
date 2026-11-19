// Mentor view: where students struggle. Cohort numbers come from TA.MENTOR_SAMPLE (illustrative);
// the "live" parts read the decisions made on this device.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const esc = TA.esc;
  const CHOICES = [
    { key: 'buy', label: 'BUY', color: '#089981' },
    { key: 'sell', label: 'SELL', color: '#f23645' },
    { key: 'wait', label: 'WAIT', color: '#4a8dff' },
  ];
  const NAME = { buy: 'BUY', sell: 'SELL', wait: 'WAIT' };

  TA.views.mentor = function (root) {
    const S = TA.MENTOR_SAMPLE, p = TA.progress.get(), live = p.decisions || [];
    const rows = S.decisions.map((d) => {
      const correct = TA.SCENARIOS[d.sid].decisions[d.dp].correct;
      const wrong = CHOICES.filter((c) => c.key !== correct).sort((a, b) => d.mix[b.key] - d.mix[a.key])[0];
      const mine = live.filter((x) => x.sid === d.sid && x.dp === d.dp).pop();
      return Object.assign({}, d, { correct, right: d.mix[correct], wrong, mine });
    });
    const avg = Math.round(rows.reduce((s, r) => s + r.right, 0) / rows.length);
    const done = S.funnel[S.funnel.length - 1].n;
    const hardest = rows.slice().sort((a, b) => a.right - b.right).slice(0, 3);
    const count = (pct) => Math.round((pct / 100) * S.cohort);

    const bar = (r) => `<div class="mix" role="img" aria-label="${CHOICES.map((c) => `${c.label} ${r.mix[c.key]}%`).join(', ')}">
      ${CHOICES.map((c) => r.mix[c.key] ? `<span class="seg" tabindex="0" style="flex:${r.mix[c.key]};background:${c.color}"
        data-tip="<b>${c.label}</b> · ${r.mix[c.key]}% · ${count(r.mix[c.key])} students${c.key === r.correct ? '<br><em>Correct answer</em>' : ''}">${r.mix[c.key] >= 12 ? `${c.label} ${r.mix[c.key]}%` : ''}</span>` : '').join('')}</div>`;

    root.innerHTML = `<div class="page mentor">
      <header class="fade-up"><p class="eyebrow">Adapt Trading · Mentor view</p><h1>Where your students struggle</h1>
        <p class="lede">Every decision students make in the replays is recorded. You see exactly which setups they misread, so your next video answers a real question.</p></header>
      <div class="sample-note fade-up" style="--d:40ms"><span class="pill pill-progress">Sample data</span><span>The cohort below is an illustrative example for this demo, not real students. The <b>Live from this device</b> panel is real: play an exercise and your own decisions show up there.</span></div>

      <section class="kpis fade-up" style="--d:80ms">
        <div class="kpi"><span>Students</span><b>${S.cohort}</b></div>
        <div class="kpi"><span>Completed both modules</span><b>${done}<small> · ${Math.round((done / S.cohort) * 100)}%</small></b></div>
        <div class="kpi"><span>First-try accuracy</span><b>${avg}%</b></div>
        <div class="kpi"><span>Median time, Fibonacci</span><b>${S.medianMinutes.fib}<small> min</small></b></div>
      </section>

      <h3 class="section-title fade-up">Biggest mistakes</h3>
      <div class="insights fade-up">${hardest.map((r) => `<article class="insight">
        <b class="insight-num">${r.mix[r.wrong.key]}%</b>
        <p>chose <b>${r.wrong.label}</b> at <b>${esc(r.label)}</b>. The correct answer was ${NAME[r.correct]}.</p>
        <span class="muted">${r.module} · ${r.right}% got it right</span></article>`).join('')}</div>

      <section class="card fade-up viz-card">
        <div class="viz-head"><div><h2>Decisions at each setup</h2><p class="muted">First-try choices, % of students. The correct answer is marked.</p></div>
          <div class="legend">${CHOICES.map((c) => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}</div></div>
        <div class="mix-rows">${rows.map((r) => `<div class="mix-row">
          <div class="mix-label"><b>${esc(r.label)}</b><span>${r.module} · correct: <em class="c-${r.correct}">${NAME[r.correct]}</em>${r.mine ? ` · <span class="you ${r.mine.correct ? 'ok' : 'bad'}">you: ${NAME[r.mine.choice]} ${r.mine.correct ? '✓' : '✕'}</span>` : ''}</span></div>
          ${bar(r)}<div class="mix-right"><b>${r.right}%</b><span>correct</span></div></div>`).join('')}</div>
        <details class="viz-table"><summary>Show as table</summary><table><thead><tr><th>Setup</th><th>Correct</th>${CHOICES.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${NAME[r.correct]}</td>${CHOICES.map((c) => `<td>${r.mix[c.key]}%</td>`).join('')}</tr>`).join('')}</tbody></table></details>
      </section>

      <div class="mentor-split">
        <section class="card fade-up"><h2>Where students drop off</h2><p class="muted">Students reaching each step.</p>
          <div class="funnel">${S.funnel.map((f) => `<div class="fn-row" tabindex="0" data-tip="<b>${esc(f.label)}</b> · ${f.n} students · ${Math.round((f.n / S.cohort) * 100)}% of cohort">
            <span class="fn-label">${esc(f.label)}</span><div class="fn-track"><i style="width:${(f.n / S.cohort) * 100}%"></i></div><b>${f.n}</b></div>`).join('')}</div>
        </section>
        <section class="card fade-up"><h2>Students to check in with</h2><p class="muted">Repeating the same mistake.</p>
          <table class="att"><tbody>${S.attention.map((a) => `<tr><td><b>${esc(a.name)}</b><span>${esc(a.pattern)}</span></td><td class="num">${a.accuracy}%</td><td class="when">${esc(a.last)}</td></tr>`).join('')}</tbody></table>
        </section>
      </div>

      <section class="card fade-up live"><div class="viz-head"><div><h2><span class="live-dot"></span>Live from this device</h2><p class="muted">Real decisions made in the replays on this browser.</p></div>
        ${live.length ? `<button class="link-btn" id="clearLive">Clear</button>` : ''}</div>
        ${live.length ? `<ul class="live-list">${live.slice(-8).reverse().map((x) => {
          const r = rows.find((y) => y.sid === x.sid && y.dp === x.dp);
          return `<li><span class="when">${new Date(x.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><b>${esc(r ? r.label : x.sid)}</b>
            <span class="choice c-${x.choice}">${NAME[x.choice]}</span><span class="${x.correct ? 'ok' : 'bad'}">${x.correct ? '✓ correct' : '✕ incorrect'}</span></li>`;
        }).join('')}</ul>`
        : `<p class="empty">No decisions yet. Play the <a href="#/fibonacci/exercise">Fibonacci</a> or <a href="#/liquidity/exercise">Liquidity</a> replay and come back.</p>`}
      </section>
    </div>`;

    const clear = root.querySelector('#clearLive');
    if (clear) clear.onclick = () => { const q = TA.progress.get(); q.decisions = []; TA.progress.save(q); TA.route(); };

    // One shared tooltip for every [data-tip] mark (hover and keyboard focus).
    const tip = document.createElement('div'); tip.className = 'viz-tip'; document.body.appendChild(tip);
    const show = (el, x, y) => { tip.innerHTML = el.dataset.tip; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on'); };
    const hide = () => tip.classList.remove('on');
    root.addEventListener('mousemove', (e) => { const el = e.target.closest('[data-tip]'); el ? show(el, e.clientX, e.clientY) : hide(); });
    root.addEventListener('mouseleave', hide);
    root.addEventListener('focusin', (e) => { const el = e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); } });
    root.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
    return () => { window.removeEventListener('scroll', hide, true); tip.remove(); };
  };
})(window.TA);
