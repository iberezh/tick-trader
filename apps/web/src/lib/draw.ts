import type { CustomSeriesOption } from 'echarts/charts';

// A drawn shape is a polyline of [timestamp, price] anchors — two points for a straight
// prediction line, many for a freehand stroke. Timestamps (not candle indices) let a line
// extend past the last candle into the future and stay glued to the data as it streams.
export interface DrawSegment {
  id: string;
  color: string;
  points: [number, number][];
}

// Renders segments through a custom series — api.coord() re-projects each anchor to pixels on
// every redraw, which keeps the shapes glued to the data (and the future region) under zoom/pan.
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
