// ILLUSTRATIVE SAMPLE COHORT for the mentor dashboard demo. Not real students.
// Replace with real aggregates once students use the platform (shape stays the same).
window.TA = window.TA || {};
TA.MENTOR_SAMPLE = {
  cohort: 48,
  medianMinutes: { fib: 14, liq: 19 },
  // How many students reached each step.
  funnel: [
    { label: 'Joined', n: 48 },
    { label: 'Fibonacci lesson', n: 44 },
    { label: 'Fibonacci replay passed', n: 31 },
    { label: 'Liquidity lesson', n: 29 },
    { label: 'Liquidity replay passed', n: 18 },
  ],
  // First-try choices at each decision point (% of students). sid + dp point at the real scenario,
  // so the correct answer always comes from the exercise data itself.
  decisions: [
    { sid: 'fibonacci', dp: 0, label: '38.2 touch, no rejection', module: 'Fibonacci', mix: { buy: 54, sell: 6, wait: 40 } },
    { sid: 'fibonacci', dp: 1, label: 'RIC at the 50', module: 'Fibonacci', mix: { buy: 71, sell: 4, wait: 25 } },
    { sid: 'liqA', dp: 0, label: 'Session high swept, FVG retest', module: 'Liquidity', mix: { buy: 9, sell: 66, wait: 25 } },
    { sid: 'liqB', dp: 0, label: 'Session low swept, FVG retest', module: 'Liquidity', mix: { buy: 69, sell: 7, wait: 24 } },
    { sid: 'liqC', dp: 0, label: 'Equal highs breakout, no confirmation', module: 'Liquidity', mix: { buy: 38, sell: 21, wait: 41 } },
    { sid: 'liqD', dp: 0, label: 'Previous day low, never swept', module: 'Liquidity', mix: { buy: 29, sell: 8, wait: 63 } },
  ],
  // Students the mentor may want to reach out to.
  attention: [
    { name: 'Student 07', accuracy: 33, pattern: 'Buys the first touch of a Fibonacci level', last: '2 days ago' },
    { name: 'Student 19', accuracy: 50, pattern: 'Treats breakouts as sweeps', last: 'today' },
    { name: 'Student 23', accuracy: 50, pattern: 'Waits through confirmed sweeps and misses the FVG entry', last: 'yesterday' },
    { name: 'Student 31', accuracy: 17, pattern: 'Stopped after the Fibonacci replay', last: '6 days ago' },
  ],
};
