import { useEffect, useRef } from 'react';
import type { ChartOption, EChartInstance } from '@/lib/echarts';
import { echarts } from '@/lib/echarts';

interface Props {
  option: ChartOption;
  height: number;
}

// Thin React wrapper: own the ECharts instance, resize with the container, dispose on unmount.
export function EChart({ option, height }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartInstance | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // Merge updates so live ticks don't reset pan/zoom state.
  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: false, lazyUpdate: true });
  }, [option]);

  return <div ref={ref} style={{ height, width: '100%' }} />;
}
