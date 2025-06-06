// store/statsStore.ts
import { StatsData } from '../types';

type StatsListener = (data: StatsData) => void;

class StatsStore {
  private listeners: Set<StatsListener> = new Set();
  private data: StatsData = {
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
    gpuAccurate: false
  };

  subscribe(listener: StatsListener): () => void {
    this.listeners.add(listener);
    listener(this.data);
    return () => this.listeners.delete(listener);
  }

  update(newData: Partial<StatsData>): void {
    this.data = { ...this.data, ...newData };
    this.listeners.forEach(listener => listener(this.data));
  }

  get(): StatsData {
    return this.data;
  }

  reset(): void {
    this.update({
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
      gpuAccurate: false
    });
  }
}

export const statsStore = new StatsStore();