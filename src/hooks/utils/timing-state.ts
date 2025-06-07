import { MutableRefObject } from 'react';
import { GPUTimingState } from '../../types';
import { VSyncDetector } from '../../utils/vsync';

export interface StatsRef {
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
  frameTimestamps: number[];
  prevTime: number;
  frameStartTime: number;
}

export interface WebGPUState {
  isWebGPU: boolean;
  hasTimestampQuery: boolean;
}

export interface TimingRefs {
  stats: MutableRefObject<StatsRef>;
  webGPUState: MutableRefObject<WebGPUState>;
  gpuTimingState: MutableRefObject<GPUTimingState>;
  vsyncDetector: MutableRefObject<VSyncDetector>;
  createdQueries: MutableRefObject<WebGLQuery[]>;
}

export function createInitialStats(): StatsRef {
  return {
    fps: 0,
    ms: 0,
    memory: 0,
    gpu: 0,
    cpu: 0,
    compute: 0,
    triangles: 0,
    drawCalls: 0,
    vsync: null,
    isWebGPU: false,
    gpuAccurate: false,
    frameTimestamps: [],
    prevTime: performance.now(),
    frameStartTime: 0
  };
}

export function createInitialWebGPUState(): WebGPUState {
  return {
    isWebGPU: false,
    hasTimestampQuery: false
  };
}

export function createInitialGPUTimingState(): GPUTimingState {
  return {
    available: false,
    ext: null,
    query: null,
    queryInProgress: false,
    lastGPUTime: 0
  };
}