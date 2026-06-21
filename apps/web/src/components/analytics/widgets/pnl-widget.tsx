import { useMemo } from 'react';
import { useMetrics } from '@/hooks/use-analytics-data';
import { pnlOption } from '@/lib/analytics-charts';
import { EChart } from '../../app/echart';

export function PnlWidget() {
  const points = useMetrics();
  const option = useMemo(() => {
    const labels = points.map((p) =>
      new Date(p.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    );
    return pnlOption(labels, points);
  }, [points]);
  return <EChart option={option} height="100%" />;
}
