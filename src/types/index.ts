export interface SmoothingConfig {
  enabled?: boolean;
  timing?: { maxSamples?: number; outlierThreshold?: number };
  geometry?: { maxSamples?: number; outlierThreshold?: number };
  memory?: { maxSamples?: number; outlierThreshold?: number };
}

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
  graphHeight?: number;
  graphHistory?: number;
  folder?: string | { name: string; collapsed?: boolean };
  columns?: number;
  columnsCompact?: number;
  fontSize?: number;
  aggressiveCount?: boolean;
  graphBackgroundColor?: string;
  graphGridColor?: string;
  trianglesBudget?: number;
  smoothing?: boolean | SmoothingConfig;
  drawCallsBudget?: number;
  showFullLabels?: boolean;  // New: show full labels in graph mode
  stats?: {
    fps?: { show?: boolean; order?: number };
    ms?: { show?: boolean; order?: number };
    memory?: { show?: boolean; order?: number };
    gpu?: { show?: boolean; order?: number };
    cpu?: { show?: boolean; order?: number };
    compute?: { show?: boolean; order?: number };
    triangles?: { show?: boolean; order?: number };
    drawCalls?: { show?: boolean; order?: number };
    vsync?: { show?: boolean; order?: number };
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

export interface GPUTimingState {
  available: boolean;
  ext: any;
  query: WebGLQuery | null;
  queryInProgress: boolean;
  lastGPUTime: number;
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
  trianglesBudget: number; 
  drawCallsBudget: number;  
  trianglesWarning: number; 
  trianglesCritical: number; 
  drawCallsWarning: number; 
  drawCallsCritical: number;
}

export interface StatConfig {
  key: keyof StatsData;
  label: string;
  shortLabel: string;
  labelSuffix?: string;
  unit?: string;
  format: (value: number) => string;
  color?: (value: number, thresholds: Thresholds) => string;
  show: boolean;
  order: number;
  showInCompact?: boolean;
  graphMin?: number;
  graphMax?: (thresholds: Thresholds) => number;
}

export type StatKey = 'fps' | 'ms' | 'memory' | 'gpu' | 'cpu' | 'compute' | 'triangles' | 'drawCalls';