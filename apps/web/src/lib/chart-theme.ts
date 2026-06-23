import type { CandlestickSeriesOption, CustomSeriesOption } from 'echarts/charts';
import type { Candle, EquityPoint } from './api';
import type { ChartOption } from './echarts';

// P1 "Phosphor" palette — green doubles as the P&L "up" colour.
export const UP = '#00e08f';
export const DOWN = '#ff5247';
export const ACCENT = '#00e08f';

const AXIS = 'rgba(255,255,255,0.08)';
const SPLIT = 'rgba(255,255,255,0.045)';
const TEXT = '#7c8a83';
const MONO = 'ui-monospace, monospace';

const fmtTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const GRID = { left: 8, right: 56, top: 12, bottom: 24, containLabel: true };
const xAxis = (labels: string[]) => ({
  type: 'category' as const,
  data: labels,
  axisLine: { lineStyle: { color: AXIS } },
  axisTick: { show: false },
  axisLabel: { color: TEXT, fontSize: 11, hideOverlap: true },
});
const yAxis = {
  scale: true,
  position: 'right' as const,
  axisLine: { show: false },
  axisLabel: { color: TEXT, fontSize: 11 },
  splitLine: { lineStyle: { color: SPLIT } },
};
const tip = (pointer: 'cross' | 'line') => ({
  trigger: 'axis' as const,
  axisPointer: { type: pointer, lineStyle: { color: AXIS } },
  backgroundColor: '#0d1115',
  borderColor: '#19222a',
  textStyle: { color: '#e9f2ec', fontFamily: MONO, fontSize: 11 },
});

export function candleOption(
  candles: Candle[],
  overlay?: CustomSeriesOption,
  lockZoom = false,
): ChartOption {
  const candlestick: CandlestickSeriesOption = {
    type: 'candlestick',
    data: candles.map((c) => [c.open, c.close, c.low, c.high]),
    itemStyle: { color: UP, color0: DOWN, borderColor: UP, borderColor0: DOWN },
  };
  return {
    animation: false,
    grid: GRID,
    tooltip: tip('cross'),
    xAxis: xAxis(candles.map((c) => fmtTime(c.t))),
    yAxis,
    // Drag pans by default; while drawing we lock it so the drag draws a line instead.
    dataZoom: [{ type: 'inside', disabled: lockZoom }],
    series: overlay ? [candlestick, overlay] : [candlestick],
  };
}

const FUTURE_FRACTION = 0.25; // when drawing, reveal this much of the visible span as future room

interface CandleTimeOpts {
  overlay?: CustomSeriesOption | undefined;
  lockZoom?: boolean;
  future?: boolean; // extend the axis past the last candle so lines can project ahead
  drawnMaxT?: number; // keep already-drawn future shapes on-screen
}

// Time-axis candlestick used by the drawing chart: a continuous x-axis (real timestamps, not
// candle indices) lets shapes sit anywhere — including a future region to the right of the
// latest candle — and gives freehand strokes smooth sub-candle coordinates.
export function candleTimeOption(candles: Candle[], opts: CandleTimeOpts = {}): ChartOption {
  const { overlay, lockZoom = false, future = false, drawnMaxT = 0 } = opts;
  const firstT = candles[0]?.t ?? 0;
  const lastT = candles[candles.length - 1]?.t ?? firstT;
  const span = Math.max(lastT - firstT, 60_000);
  const pad = candles.length > 1 ? (span / (candles.length - 1)) * 2 : 30_000;
  const max = Math.max(lastT + pad + (future ? span * FUTURE_FRACTION : 0), drawnMaxT + pad);
  const candlestick: CandlestickSeriesOption = {
    type: 'candlestick',
    barMaxWidth: 14,
    data: candles.map((c) => [c.t, c.open, c.close, c.low, c.high]),
    itemStyle: { color: UP, color0: DOWN, borderColor: UP, borderColor0: DOWN },
  };
  return {
    animation: false,
    grid: GRID,
    tooltip: tip('cross'),
    xAxis: {
      type: 'time',
      min: firstT,
      max,
      axisLine: { lineStyle: { color: AXIS } },
      axisTick: { show: false },
      axisLabel: {
        color: TEXT,
        fontSize: 11,
        hideOverlap: true,
        formatter: (value: number) =>
          new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    },
    yAxis,
    dataZoom: [{ type: 'inside', disabled: lockZoom }],
    series: overlay ? [candlestick, overlay] : [candlestick],
  };
}

export function equityOption(points: EquityPoint[]): ChartOption {
  const first = points[0];
  const last = points[points.length - 1];
  const up = !first || !last || last.equity >= first.equity;
  const tint = up ? 'rgba(0,224,143,0.22)' : 'rgba(255,82,71,0.22)';
  return {
    animation: false,
    grid: GRID,
    tooltip: tip('line'),
    xAxis: xAxis(points.map((p) => fmtTime(p.t))),
    yAxis,
    series: [
      {
        type: 'line',
        data: points.map((p) => p.equity),
        showSymbol: false,
        lineStyle: { color: up ? UP : DOWN, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: tint },
              { offset: 1, color: 'rgba(0,0,0,0)' },
            ],
          },
        },
      },
    ],
  };
}
