// Exercise scenarios as data. Each scenario = scripted candles + where playback starts + decision points.
// Decision point fields: at (candle index after which playback pauses), correct, trades (SL/TP per side,
// entry = close of the `at` candle), feedback per choice. Add new exercises by adding entries here.
window.TA = window.TA || {};
(function (TA) {
  'use strict';
  const utc = (h, m) => Date.UTC(2026, 10, 17, h, m) / 1000;
  const S = (TA.SCENARIOS = {});

  // ---------------- Fibonacci: impulse → no rejection at 38.2 → RIC at 50 ----------------
  {
    const b = new TA.Builder({ start: 21018, time: utc(14, 0), seed: 11 });
    b.walk(21022, 12, { vol: 3, min: 21008, max: 21032 })
      .walk(21015, 10, { vol: 3, min: 21006, max: 21030 })
      .walk(21012, 4, { vol: 2.5, min: 21004, max: 21026 });
    const historyEnd = b.n - 1;
    b.ohlc(21012, 21013.5, 21000, 21003.25).mark('swingLow')
      .ohlc(21003.25, 21012.5, 21002.5, 21011.75)
      .walk(21094, 9, { vol: 2, wick: 0.6, min: 21008, max: 21098 })
      .ohlc(21094, 21100, 21092.5, 21097.25).mark('swingHigh')
      .ohlc(21097.25, 21098, 21089.75, 21091.5);
    const introEnd = b.n - 1;
    b.walk(21068, 5, { vol: 3, min: 21064, max: 21095 })
      // 38.2 touched, candles drift through it with no rejection
      .ohlc(21068, 21069.5, 21061.5, 21063)
      .ohlc(21063, 21065, 21060.5, 21061.5)
      .ohlc(21061.5, 21063.25, 21059.75, 21060.25).mark('dp1')
      .walk(21051.5, 4, { vol: 2, min: 21050.5, max: 21063 })
      // RIC at 50: Rejection, Impulsion, Correction (wick cluster on the 50)
      .ohlc(21051.5, 21054.5, 21047, 21053.75).mark('rejection')
      .ohlc(21053.75, 21061, 21053, 21060.25)
      .ohlc(21060.25, 21066.5, 21059.5, 21065.75).mark('impulsion')
      .ohlc(21065.75, 21066.25, 21059, 21059.75)
      .ohlc(21059.75, 21060.5, 21053.25, 21054.5)
      .ohlc(21054.5, 21056.25, 21050.25, 21055.5).mark('dp2')
      .ohlc(21055.5, 21062, 21055, 21061.5)
      .walk(21091.5, 9, { vol: 3, min: 21056, max: 21094 })
      .walk(21084, 5, { vol: 3, min: 21078, max: 21095 });
    const m = b.marks;
    S.fibonacci = {
      id: 'fibonacci', symbol: 'NAS100', tick: 0.25, candles: b.candles,
      historyEnd, introEnd,
      swing: { low: { i: m.swingLow, price: 21000 }, high: { i: m.swingHigh, price: 21100 } },
      ricMarks: { rejection: m.rejection, impulsion: m.impulsion, correction: m.dp2 },
      decisions: [
        {
          at: m.dp1, correct: 'wait',
          question: 'Price is reacting around a Fibonacci level. What do you do?',
          trades: { buy: { sl: 21052.25, tp: 21076 }, sell: { sl: 21068.25, tp: 21040 } },
          feedback: {
            wait: 'Good decision. Price touched the 38.2 without a valid rejection.',
            buy: 'Incorrect. Price touched the 38.2, but a touch alone is not an entry. There was no rejection, and the trade stopped out.',
            sell: 'Incorrect. There was no valid signal at the 38.2. Waiting was the right call.',
          },
        },
        {
          at: m.dp2, correct: 'buy',
          question: 'Price is reacting around a Fibonacci level. What do you do?',
          trades: { buy: { sl: 21046.75, tp: 21090 }, sell: { sl: 21064.25, tp: 21037 } },
          feedback: {
            buy: 'Correct! Rejection, Impulsion, Correction at the 50. The RIC was confirmed and price reached the target.',
            sell: 'Incorrect. The RIC at the 50 pointed to a long, not a short.',
            wait: 'Missed. The RIC at the 50 was the valid setup, and price left without you.',
          },
        },
      ],
    };
  }

  // ---------------- Liquidity sweeps ----------------
  const LV = { session: '#e0b04a', day: '#4f8cff', equal: '#e05aa0' };

  // FVG zone that appears on the chart only once its third candle has closed.
  const fvgZone = (f1, f3, top, bottom) => ({ from: f1, showAfter: f3, top, bottom, label: 'FVG', color: 'rgba(79,140,255,0.16)', border: 'rgba(110,160,255,0.75)' });

  // A — previous session high swept (2-candle close & reverse) → displacement leaves an FVG → retest into the FVG → SELL
  {
    const b = new TA.Builder({ start: 20500, time: utc(7, 0), seed: 21 });
    b.walk(20518, 8, { vol: 4, min: 20486, max: 20534 })
      .ohlc(20518, 20540, 20516, 20531).mark('psh')
      .walk(20495, 9, { vol: 4, min: 20484, max: 20534 })
      .ohlc(20495, 20497, 20480, 20488.5).mark('psl')
      .walk(20505, 8, { vol: 4, min: 20484, max: 20530 });
    const sep = b.n;
    b.skip(330).walk(20520, 10, { vol: 3.5, min: 20490, max: 20534 });
    const historyEnd = b.n - 1;
    b.walk(20536, 4, { vol: 2.5, min: 20515, max: 20538.5 })
      .ohlc(20536, 20546, 20534.5, 20544.25).mark('c1')     // closes above the high
      .ohlc(20544.25, 20545.5, 20531, 20533).mark('c2')     // closes back below — FVG candle 1
      .ohlc(20533, 20534, 20521, 20522.5)                   // displacement
      .ohlc(20522.5, 20524, 20514, 20516).mark('f3')        // FVG = [f3.high, c2.low] = [20524, 20531]
      .ohlc(20516, 20518, 20511, 20513.5)
      .ohlc(20513.5, 20520, 20512.5, 20519)
      .ohlc(20519, 20527.5, 20518, 20525.75).mark('entry')  // retests back toward the level, into the FVG
      .walk(20481, 12, { vol: 3, min: 20480.5, max: 20527 })
      .walk(20486, 3, { vol: 3, min: 20480.5, max: 20500 });
    const m = b.marks;
    S.liqA = {
      id: 'liqA', title: 'Previous Session High', symbol: 'NAS100', tick: 0.25, candles: b.candles, historyEnd,
      check: { type: 'bearish', level: 20540, c1: m.c1, c2: m.c2, sessionEnd: sep, fvg: { f1: m.c2, f3: m.f3, top: 20531, bottom: 20524, entry: m.entry } },
      separators: [{ i: 0, label: 'London' }, { i: sep, label: 'New York' }],
      levels: [
        { price: 20540, label: 'Previous Session High', color: LV.session, from: m.psh, autoscale: true },
        { price: 20480, label: 'Previous Session Low', color: LV.session, from: m.psl },
      ],
      zones: [fvgZone(m.c2, m.f3, 20531, 20524)],
      intro: 'New York is pushing into the London session high. Watch how price reacts at the level.',
      decisions: [{
        at: m.entry, correct: 'sell',
        question: 'Price is retracing back toward the Previous Session High. What do you do?',
        trades: { sell: { sl: 20547, tp: 20482 }, buy: { sl: 20511, tp: 20555 } },
        feedback: {
          sell: 'Correct! The sweep was confirmed, price left an FVG, and you sold the retest into it.',
          buy: 'Incorrect. After a confirmed bearish sweep, the retest into the FVG is a short, not a long.',
          wait: 'Missed. The sweep was confirmed and the retest into the FVG was the entry.',
        },
      }],
    };
  }

  // B — previous session low swept → displacement leaves an FVG → retest into the FVG → BUY
  {
    const b = new TA.Builder({ start: 20340, time: utc(7, 0), seed: 33 });
    b.walk(20330, 8, { vol: 4, min: 20314, max: 20368 })
      .ohlc(20330, 20333, 20310, 20318).mark('psl')
      .walk(20352, 9, { vol: 4, min: 20316, max: 20368 })
      .ohlc(20352, 20370, 20350, 20361.5).mark('psh')
      .walk(20345, 8, { vol: 4, min: 20316, max: 20366 });
    const sep = b.n;
    b.skip(330).walk(20330, 10, { vol: 3.5, min: 20314, max: 20360 });
    const historyEnd = b.n - 1;
    b.walk(20314, 4, { vol: 2.5, min: 20311.5, max: 20335 })
      .ohlc(20314, 20315.5, 20303.75, 20305.5).mark('c1')   // closes below the low
      .ohlc(20305.5, 20319, 20304.5, 20317.25).mark('c2')   // closes back above — FVG candle 1
      .ohlc(20317.25, 20330, 20316, 20328.5)                // displacement
      .ohlc(20328.5, 20337, 20326, 20335.5).mark('f3')      // FVG = [c2.high, f3.low] = [20319, 20326]
      .ohlc(20335.5, 20339, 20333, 20337)
      .ohlc(20337, 20338, 20330.5, 20331)
      .ohlc(20331, 20332, 20322.5, 20324.25).mark('entry')  // retests back toward the level, into the FVG
      .walk(20369, 12, { vol: 3, min: 20322, max: 20369.75 })
      .walk(20364, 3, { vol: 3, min: 20350, max: 20369.75 });
    const m = b.marks;
    S.liqB = {
      id: 'liqB', title: 'Previous Session Low', symbol: 'NAS100', tick: 0.25, candles: b.candles, historyEnd,
      check: { type: 'bullish', level: 20310, c1: m.c1, c2: m.c2, sessionEnd: sep, fvg: { f1: m.c2, f3: m.f3, top: 20326, bottom: 20319, entry: m.entry } },
      separators: [{ i: 0, label: 'London' }, { i: sep, label: 'New York' }],
      levels: [
        { price: 20370, label: 'Previous Session High', color: LV.session, from: m.psh },
        { price: 20310, label: 'Previous Session Low', color: LV.session, from: m.psl, autoscale: true },
      ],
      zones: [fvgZone(m.c2, m.f3, 20326, 20319)],
      intro: 'Price is drifting toward the London session low. Watch the candles close around the level.',
      decisions: [{
        at: m.entry, correct: 'buy',
        question: 'Price is retracing back toward the Previous Session Low. What do you do?',
        trades: { buy: { sl: 20303, tp: 20368 }, sell: { sl: 20339, tp: 20290 } },
        feedback: {
          buy: 'Correct! The sweep was confirmed, price left an FVG, and you bought the retest into it.',
          sell: 'Incorrect. After a confirmed bullish sweep, the retest into the FVG is a long, not a short.',
          wait: 'Missed. The sweep was confirmed and the retest into the FVG was the entry.',
        },
      }],
    };
  }

  // C — equal highs broken, but the second candle also closes above → no confirmation → WAIT
  {
    const b = new TA.Builder({ start: 20690, time: utc(13, 0), seed: 44 });
    b.walk(20712, 8, { vol: 3.5, min: 20680, max: 20720 })
      .ohlc(20712, 20725, 20710, 20716.5).mark('eh1')
      .walk(20698, 8, { vol: 3.5, min: 20684, max: 20720 })
      .walk(20714, 6, { vol: 3.5, min: 20690, max: 20720 })
      .ohlc(20714, 20725.25, 20711.5, 20713).mark('eh2')
      .walk(20700, 8, { vol: 3.5, min: 20686, max: 20720 })
      .walk(20712, 6, { vol: 3, min: 20692, max: 20720 });
    const historyEnd = b.n - 1;
    b.walk(20721, 3, { vol: 2, min: 20705, max: 20723 })
      .ohlc(20721, 20731.5, 20720, 20729.75).mark('c1')
      .ohlc(20729.75, 20736, 20727.5, 20734.5).mark('c2')
      .walk(20738, 3, { vol: 2.5, min: 20729, max: 20744 })
      .ohlc(20738, 20749.5, 20736, 20741)
      .walk(20728, 4, { vol: 2.5, min: 20722, max: 20744 })
      .walk(20716, 4, { vol: 2.5, min: 20714, max: 20730 })
      .walk(20722, 3, { vol: 2.5, min: 20714, max: 20730 });
    S.liqC = {
      id: 'liqC', title: 'Equal Highs', symbol: 'NAS100', tick: 0.25, candles: b.candles, historyEnd,
      check: { type: 'breakout', level: 20725, c1: b.marks.c1, c2: b.marks.c2 },
      separators: [{ i: 0, label: 'New York' }],
      levels: [{ price: 20725, label: 'Equal Highs', color: LV.equal, from: b.marks.eh1, autoscale: true }],
      markers: [{ i: b.marks.eh1, price: 20725, text: '=', color: LV.equal }, { i: b.marks.eh2, price: 20725.25, text: '=', color: LV.equal }],
      intro: 'Two highs formed at the same price. Watch what happens when price returns to them.',
      decisions: [{
        at: b.marks.c2, correct: 'wait',
        question: 'Price is trading around the Equal Highs. What do you do?',
        trades: { sell: { sl: 20745, tp: 20704 }, buy: { sl: 20719, tp: 20765.5 } },
        feedback: {
          wait: 'Correct. No valid confirmation yet. The second candle did not close back below the level.',
          sell: 'Incorrect. The second candle did not close back below the level, so the sweep was never confirmed.',
          buy: 'Incorrect. This was a simple breakout with no confirmed sweep. There was no setup to take.',
        },
      }],
    };
  }

  // D — previous day low approached but never swept → WAIT
  {
    const b = new TA.Builder({ start: 20190, time: utc(13, 0), seed: 55 });
    b.walk(20170, 10, { vol: 4, min: 20146, max: 20205 })
      .ohlc(20170, 20172, 20140, 20151).mark('pdl')
      .walk(20185, 10, { vol: 4, min: 20146, max: 20205 })
      .walk(20175, 8, { vol: 4, min: 20150, max: 20205 });
    const sep = b.n;
    b.skip(1050).walk(20168, 10, { vol: 3, min: 20150, max: 20190 });
    const historyEnd = b.n - 1;
    b.walk(20149, 5, { vol: 2.5, min: 20145, max: 20172 })
      .ohlc(20149, 20151.5, 20143.5, 20147)
      .ohlc(20147, 20150, 20142.75, 20148.25).mark('stall')
      .ohlc(20148.25, 20155, 20147, 20153.5)
      .walk(20156, 2, { vol: 2, min: 20146, max: 20158.5 })
      .ohlc(20156, 20160.5, 20152, 20154)
      .walk(20142, 5, { vol: 2.5, min: 20141, max: 20158 })
      .ohlc(20142, 20143, 20133.5, 20136)
      .walk(20131, 3, { vol: 2.5, min: 20126, max: 20140 });
    S.liqD = {
      id: 'liqD', title: 'Previous Day Low', symbol: 'NAS100', tick: 0.25, candles: b.candles, historyEnd,
      check: { type: 'untouched', level: 20140, upTo: b.marks.stall, from: sep },
      separators: [{ i: 0, label: 'Previous day' }, { i: sep, label: 'New day' }],
      levels: [{ price: 20140, label: 'Previous Day Low', color: LV.day, from: b.marks.pdl, autoscale: true }],
      intro: 'A new day opens above the previous day low. Price starts falling toward it.',
      decisions: [{
        at: b.marks.stall, correct: 'wait',
        question: 'Price is trading near the Previous Day Low. What do you do?',
        trades: { buy: { sl: 20135, tp: 20174.75 }, sell: { sl: 20159, tp: 20122 } },
        feedback: {
          wait: 'Correct. The level was never swept, so there was no setup.',
          buy: 'Incorrect. Price never broke below the previous day low. There was no sweep to confirm.',
          sell: 'Incorrect. There was no sweep and no confirmation, so there was nothing to trade yet.',
        },
      }],
    };
  }

  TA.LIQUIDITY_SET = ['liqA', 'liqB', 'liqC', 'liqD'];
})(window.TA);
