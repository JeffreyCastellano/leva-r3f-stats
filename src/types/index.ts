export interface StatsOptions {
  updateInterval?: number;
  targetFramerate?: number | null;
  compact?: boolean;
  showColors?: boolean;
  defaultColor?: string;
  showMinMax?: boolean;
  trackCompute?: boolean;
  vsync?: boolean;
  order?: number;
  folder?: string | { name: string; collapsed?: boolean };
  graphHeight?: number;
  graphHistory?: number;
  columns?: number;
  columnsCompact?: number;
  columnsGraph?: number;
  fontSize?: number; 
  stats?: {
    [key: string]: {
      show?: boolean;
      order?: number;
    };
  };
}

export interface StatsData {
  fps: number;
  ms: number;
  memory: number;
  gpu: number;
  cpu: number;
  compute: number;
  triangles: number;
  drawCalls: number;
  vsync: number | null;
  isWebGPU: boolean;
  gpuAccurate: boolean;
}

export interface StatConfig {
  key: keyof StatsData;
  label: string;
  shortLabel: string;
  unit?: string;
  format: (value: number) => string;
  color?: (value: number, thresholds: Thresholds) => string;
  show: boolean;
  order: number;
  showInCompact?: boolean;
  graphMin?: number;
  graphMax?: (thresholds: Thresholds) => number;
}

export interface Thresholds {
  fpsWarning: number;
  fpsCritical: number;
  msWarning: number;
  msCritical: number;
  gpuWarning: number;
  gpuCritical: number;
  targetFPS: number;
  targetMS: number;
}

export interface GPUTimingState {
  available: boolean;
  ext: any;
  query: WebGLQuery | null;
  queryInProgress: boolean;
  lastGPUTime: number;
}