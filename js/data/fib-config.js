// Fibonacci configuration — mirrors the mentor's TradingView settings (assets/fibonacci-settings.png).
// Rows are listed in dialog order, including the disabled duplicate 0.5 / 0.71 slots, which are
// shown in the settings replica but never drawn on the chart.
// TODO(verify against screenshot): which rows are red and the exact row order. Change `red: true/false` below.
window.TA = window.TA || {};
TA.FIB_CONFIG = {
  trendLine: false,
  extend: "Don't extend",
  colors: { red: '#f23645', neutral: '#8b8f99' },
  rows: [
    { value: 0, enabled: true, red: false },
    { value: 0.236, enabled: true, red: false },
    { value: 0.382, enabled: true, red: false },
    { value: 0.5, enabled: false, red: false },
    { value: 0.5, enabled: true, red: false },
    { value: 0.618, enabled: true, red: true },
    { value: 0.65, enabled: true, red: true },
    { value: 0.71, enabled: false, red: false },
    { value: 0.71, enabled: true, red: true },
    { value: 0.786, enabled: true, red: false },
    { value: 0.886, enabled: true, red: false },
    { value: 1, enabled: true, red: false },
    { value: -0.272, enabled: true, red: false },
    { value: -0.618, enabled: true, red: false },
    { value: -1, enabled: true, red: false },
  ],
  // Teaching descriptions supplied for the prototype — no extra rules added.
  teaching: [
    { value: 0.236, label: 'Quick retracement / pullback' },
    { value: 0.382, label: 'Quick retracement / pullback' },
    { value: 0.5, label: 'Pullback level' },
    { value: 0.618, label: 'Long retracement and golden ratio' },
    { value: 0.65, label: 'Additional custom level' },
    { value: 0.71, label: 'Additional custom level' },
    { value: 0.786, label: 'Deeper retracement' },
    { value: 0.886, label: 'Deep retracement, often associated with liquidity' },
  ],
};

// Enabled, de-duplicated levels that the chart actually draws.
TA.fibLevels = function () {
  const seen = new Set(), c = TA.FIB_CONFIG;
  return c.rows.filter((r) => r.enabled && !seen.has(r.value) && seen.add(r.value))
    .map((r) => ({ value: r.value, color: r.red ? c.colors.red : c.colors.neutral, red: r.red }));
};
TA.fibPrice = (fib, level) => fib.p2.price + (fib.p1.price - fib.p2.price) * level; // TradingView: 0 at the 2nd anchor, 1 at the 1st
