import type {
  BarSeriesOption,
  CandlestickSeriesOption,
  CustomSeriesOption,
  LineSeriesOption,
} from 'echarts/charts';
import { BarChart, CandlestickChart, CustomChart, LineChart } from 'echarts/charts';
import type {
  DataZoomComponentOption,
  GraphicComponentOption,
  GridComponentOption,
  MarkLineComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import type { ComposeOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

// Register only the pieces we use so the bundle tree-shakes (ECharts is large otherwise).
echarts.use([
  CandlestickChart,
  LineChart,
  BarChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  GraphicComponent,
  CanvasRenderer,
]);

export type ChartOption = ComposeOption<
  | CandlestickSeriesOption
  | LineSeriesOption
  | BarSeriesOption
  | CustomSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
  | MarkLineComponentOption
  | GraphicComponentOption
>;

export type EChartInstance = ReturnType<typeof echarts.init>;
export { echarts };
