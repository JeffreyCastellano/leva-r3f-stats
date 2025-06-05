export interface StatsData {
    fps: number;
    ms: number;
    memory: number;
    gpu: number;
    compute: number;
    triangles: number;
    drawCalls: number;
    vsync: number | null;
    isWebGPU: boolean;
  }
  
  export interface StatsOptions {
    updateInterval?: number;
    targetFramerate?: number | null;
    compact?: boolean;
    showColors?: boolean;
    defaultColor?: string;
    showMinMax?: boolean;
    trackCompute?: boolean;
    showTriangles?: boolean;
    vsync?: boolean;
    order?: number;
  }
  
  export interface MinMaxData {
    min: number;
    max: number;
    current: number;
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