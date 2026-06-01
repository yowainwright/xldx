export type ChartType = "bar" | "column" | "line" | "pie" | "area" | "scatter";

export interface ChartPosition {
  cell: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ChartSeries {
  name?: string;
  dataRange: string;
  labelRange?: string;
}

export interface ChartOptions {
  type: ChartType;
  series: ChartSeries[];
  position: ChartPosition | string;
  title?: string;
  sheet?: string;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
}

export interface ChartData {
  id: number;
  options: ChartOptions;
  sheet: string;
}

export interface ChartHooksPluginState {
  charts: Map<string, ChartData[]>;
  chartCounter: number;
}

export interface CellPosition {
  col: number;
  row: number;
}
