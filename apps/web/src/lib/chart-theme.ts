import type { ChartOptions, DeepPartial } from 'lightweight-charts';

export const UP = '#2ebd85';
export const DOWN = '#f6465d';
export const LINE = '#4f9cf9';

export const chartOptions = (height: number): DeepPartial<ChartOptions> => ({
  height,
  layout: { background: { color: 'transparent' }, textColor: '#8b94a3', fontSize: 11 },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.04)' },
    horzLines: { color: 'rgba(255,255,255,0.04)' },
  },
  rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
  timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: true, secondsVisible: true },
});
