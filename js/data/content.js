// Course structure and lesson copy. Placeholder copy is marked so the mentor's material can replace it.
window.TA = window.TA || {};
TA.PATH = [
  { id: 'fibLesson', module: 'fib', kind: 'lesson', title: 'Fibonacci Settings', meta: 'Video + settings · 4 min', route: '#/fibonacci' },
  { id: 'fibExercise', module: 'fib', kind: 'exercise', title: 'Replay: Draw, Wait, Enter', meta: 'Interactive chart · 3 min', route: '#/fibonacci/exercise' },
  { id: 'liqLesson', module: 'liq', kind: 'lesson', title: 'Liquidity Levels', meta: 'Video + 7 concepts · 5 min', route: '#/liquidity' },
  { id: 'liqExercise', module: 'liq', kind: 'exercise', title: 'Replay: Four Sweep Setups', meta: 'Interactive chart · 5 min', route: '#/liquidity/exercise' },
];

TA.MODULES = [
  {
    id: 'fib', num: '01', title: 'Fibonacci Retracement',
    desc: 'Understand Fibonacci retracements, identify important levels, and learn how to recognize valid and invalid trading opportunities.',
  },
  {
    id: 'liq', num: '02', title: 'Liquidity',
    desc: 'Understand where liquidity is located, recognize liquidity sweeps, and identify potential reversal opportunities.',
  },
];

TA.ACHIEVEMENTS = [
  { id: 'firstFib', title: 'First Fibonacci', desc: 'Drew a valid retracement' },
  { id: 'patient', title: 'Patient Trader', desc: 'Waited when there was no setup' },
  { id: 'ric', title: 'RIC Spotter', desc: 'Passed the Fibonacci replay' },
  { id: 'sweep', title: 'Sweep Reader', desc: 'Passed all four liquidity setups' },
];

TA.LIQUIDITY_CONCEPTS = [
  { id: 'pd', title: 'Previous Day High and Low', text: 'The highest and lowest prices of the previous trading day.' },
  { id: 'ps', title: 'Previous Session High and Low', text: 'The highest and lowest prices of the previous trading session.' },
  { id: 'asia', title: 'Asian Session High and Low', text: 'The high and low formed during the Asian session.' },
  { id: 'london', title: 'London Session High and Low', text: 'The high and low formed during the London session.' },
  { id: 'equal', title: 'Equal Highs and Equal Lows', text: 'Two or more highs, or two or more lows, formed at the same price.' },
  { id: 'owg', title: 'Opening Week Gap', text: "The gap between the previous week's closing price and the new week's opening price." },
  { id: 'ndg', title: 'New Day Gap', text: "The gap between the previous day's closing price and the new day's opening price." },
];

TA.QUIZ = {
  fib: [
    { q: 'Which level is described as the golden ratio?', options: ['0.382', '0.5', '0.618', '0.886'], answer: 2, explain: '0.618 is the long retracement and golden ratio level.' },
    { q: 'Price touches a Fibonacci level. Is that alone a valid entry?', options: ['Yes, any touch is an entry', 'No, wait for a valid rejection such as a RIC'], answer: 1, explain: 'A touch is not an entry. Look for Rejection, Impulsion, Correction.' },
    { q: 'For a bullish impulse, how do you draw the Fibonacci?', options: ['Swing high to swing low', 'Swing low to swing high'], answer: 1, explain: 'Bullish impulse: from the swing low to the swing high.' },
  ],
  liq: [
    { q: 'Previous session high. What confirms a potential bearish sweep in this model?', options: ['One candle wicks above the level', 'Candle 1 closes above, then candle 2 closes back below', 'Price closes above twice in a row'], answer: 1, explain: 'Candle 1 closes above the level, then candle 2 closes back below it.' },
    { q: 'The sweep is confirmed and price displaces, leaving an FVG. Where is the entry?', options: ['Immediately, at the close of candle 2', 'On the retest back into the FVG', 'After price breaks the level again'], answer: 1, explain: 'Wait for price to retest back toward the level, into the FVG.' },
    { q: 'Price breaks above a level and the next candle also closes above. What is it?', options: ['A confirmed sweep, so sell', 'A breakout with no sweep confirmation, so wait'], answer: 1, explain: 'Without the second candle closing back below, the sweep is not confirmed.' },
  ],
};
