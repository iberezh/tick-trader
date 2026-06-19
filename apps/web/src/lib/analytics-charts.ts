import type { Position } from '@tick-trader/contracts';
import type { EquityPoint } from './api';
import type { ChartOption } from './echarts';

export const SERIES_COLORS = ['#00e08f', '#4cc9f0', '#ffae3b'];
const AXIS = 'rgba(255,255,255,0.08)';
const SPLIT = 'rgba(255,255,255,0.045)';
const TEXT = '#7c8a83';
const MONO = 'ui-monospace, monospace';
const GRID = { left: 8, right: 52, top: 10, bottom: 22, containLabel: true };

const baseX = (labels: string[]) => ({
  type: 'category' as const,
  data: labels,
  axisLine: { lineStyle: { color: AXIS } },
  axisTick: { show: false },
  axisLabel: { color: TEXT, fontSize: 10, hideOverlap: true },
});
const baseY = {
  scale: true,
  position: 'right' as const,
  axisLine: { show: false },
  axisLabel: { color: TEXT, fontSize: 10 },
  splitLine: { lineStyle: { color: SPLIT } },
};
const baseTip = {
  trigger: 'axis' as const,
  axisPointer: { type: 'line' as const, lineStyle: { color: AXIS } },
  backgroundColor: '#0d1115',
  borderColor: '#19222a',
  textStyle: { color: '#e9f2ec', fontFamily: MONO, fontSize: 11 },
};

export interface SymbolSeries {
  symbol: string;
  color: string;
  data: number[];
}

export function symbolsOption(labels: string[], series: SymbolSeries[]): ChartOption {
  return {
    animation: false,
    grid: GRID,
    tooltip: { ...baseTip, axisPointer: { type: 'cross', lineStyle: { color: AXIS } } },
    xAxis: baseX(labels),
    yAxis: { ...baseY, axisLabel: { color: TEXT, fontSize: 10, formatter: '{value}%' } },
    series: series.map((s) => ({
      type: 'line',
      name: s.symbol,
      data: s.data,
      showSymbol: false,
      lineStyle: { color: s.color, width: 1.6 },
    })),
  };
}

export function pnlOption(labels: string[], points: EquityPoint[]): ChartOption {
  return {
    animation: false,
    grid: GRID,
    tooltip: baseTip,
    xAxis: baseX(labels),
    yAxis: baseY,
    series: [
      {
        type: 'line',
        name: 'realized',
        data: points.map((p) => p.realizedPnl),
        showSymbol: false,
        lineStyle: { color: '#00e08f', width: 1.6 },
      },
      {
        type: 'line',
        name: 'unrealized',
        data: points.map((p) => p.unrealizedPnl),
        showSymbol: false,
        lineStyle: { color: '#4cc9f0', width: 1.6 },
      },
    ],
  };
}

export function allocationOption(positions: Position[]): ChartOption {
  const rows = positions.filter((p) => p.qty !== 0);
  return {
    animation: false,
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseTip, trigger: 'item' },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: rows.map((p) => p.symbol.replace('USDT', '')),
      axisLine: { lineStyle: { color: AXIS } },
      axisTick: { show: false },
      axisLabel: { color: TEXT, fontFamily: MONO, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        data: rows.map((p, i) => ({
          value: Math.abs(p.qty * p.avgCost),
          itemStyle: {
            color: SERIES_COLORS[i % SERIES_COLORS.length] ?? '#00e08f',
            borderRadius: [0, 3, 3, 0],
          },
        })),
      },
    ],
  };
}
