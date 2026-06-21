import type { CandlestickSeriesOption, CustomSeriesOption } from 'echarts/charts';
import type { Candle, EquityPoint } from './api';
import type { ChartOption } from './echarts';

// A prediction line is anchored to data coords ([candle index, price]) so it tracks
// the chart as candles stream in or the view zooms.
export interface DrawSegment {
  id: string;
  color: string;
  points: [number, number][];
}

// Renders segments through a custom series — api.coord() re-projects to pixels on every
// redraw, which is what keeps the lines glued to the data rather than the screen.
export function drawOverlay(segments: DrawSegment[]): CustomSeriesOption {
  return {
    type: 'custom',
    silent: true,
    z: 6,
    animation: false,
    data: segments.map((s) => s.points),
    renderItem: (params, api) => {
      const seg = segments[params.dataIndex];
      if (!seg) return { type: 'group', children: [] };
      const points = seg.points.map((p) => api.coord(p));
      return {
        type: 'polyline',
        shape: { points },
        style: { stroke: seg.color, lineWidth: 1.5, fill: 'none' },
        silent: true,
      };
    },
  };
}

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
