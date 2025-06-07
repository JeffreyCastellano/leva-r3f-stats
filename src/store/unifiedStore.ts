import { StatsData } from '../types';
import { RingBuffer } from '../utils/buffer';

type StatsListener = (data: StatsData) => void;
type BufferKey = keyof Omit<StatsData, 'vsync' | 'isWebGPU' | 'gpuAccurate'>;

interface PeakValues {
  triangles: number;
  drawCalls: number;
  lastReset: number;
}

class UnifiedStore {
  private listeners = new Set<StatsListener>();
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
  
  public buffers: Record<BufferKey, RingBuffer> = {
    fps: new RingBuffer(100),
    ms: new RingBuffer(100),
    memory: new RingBuffer(100),
    gpu: new RingBuffer(100),
    cpu: new RingBuffer(100),
    compute: new RingBuffer(100),
    triangles: new RingBuffer(100),
    drawCalls: new RingBuffer(100)
  };

  private peaks: PeakValues = {
    triangles: 0,
    drawCalls: 0,
    lastReset: Date.now()
  };

  private instanceCount = 0;
  private updateScheduled = false;
  private pendingUpdates: Partial<StatsData> = {};
  
  subscribe(listener: StatsListener): () => void {
    this.listeners.add(listener);
    listener(this.data);
    return () => this.listeners.delete(listener);
  }

  update(newData: Partial<StatsData>): void {
    Object.assign(this.pendingUpdates, newData);
    
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      queueMicrotask(() => this.flushUpdates());
    }
  }

  private flushUpdates(): void {
    if (this.pendingUpdates.triangles !== undefined && 
        this.pendingUpdates.triangles > this.peaks.triangles) {
      this.peaks.triangles = this.pendingUpdates.triangles;
    }
    if (this.pendingUpdates.drawCalls !== undefined && 
        this.pendingUpdates.drawCalls > this.peaks.drawCalls) {
      this.peaks.drawCalls = this.pendingUpdates.drawCalls;
    }

    this.data = { ...this.data, ...this.pendingUpdates };
    
    Object.entries(this.pendingUpdates).forEach(([key, value]) => {
      if (key in this.buffers && typeof value === 'number') {
        this.buffers[key as BufferKey].push(value);
      }
    });
    
    this.listeners.forEach(listener => {
      try {
        listener(this.data);
      } catch (error) {
        console.error('Stats listener error:', error);
      }
    });
    
    this.pendingUpdates = {};
    this.updateScheduled = false;
  }

  get(): StatsData {
    return this.data;
  }

  getPeaks(): PeakValues {
    return { ...this.peaks };
  }

  resetPeaks(): void {
    this.peaks = {
      triangles: this.data.triangles,
      drawCalls: this.data.drawCalls,
      lastReset: Date.now()
    };
  }

  resizeBuffers(size: number): void {
    Object.values(this.buffers).forEach(buffer => buffer.resize(size));
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
    Object.values(this.buffers).forEach(buffer => buffer.clear());
    this.peaks = {
      triangles: 0,
      drawCalls: 0,
      lastReset: Date.now()
    };
  }

  registerInstance(): () => void {
    this.instanceCount++;
    return () => {
      this.instanceCount--;
      if (this.instanceCount === 0) {
        this.reset();
        this.listeners.clear();
      }
    };
  }

  getInstanceCount(): number {
    return this.instanceCount;
  }
}

export const unifiedStore = new UnifiedStore();

export const statsStore = {
  subscribe: (fn: StatsListener) => unifiedStore.subscribe(fn),
  update: (data: Partial<StatsData>) => unifiedStore.update(data),
  get: () => unifiedStore.get(),
  getPeaks: () => unifiedStore.getPeaks(),
  resetPeaks: () => unifiedStore.resetPeaks(),
  reset: () => unifiedStore.reset(),
  registerInstance: () => unifiedStore.registerInstance(),
  getInstanceCount: () => unifiedStore.getInstanceCount()
};

export const globalBuffers = unifiedStore.buffers;

export const updateBufferSize = (size: number) => unifiedStore.resizeBuffers(size);

export const registerInstance = () => unifiedStore.registerInstance();
export const getInstanceCount = () => unifiedStore.getInstanceCount();

export function createInstanceBuffers(size: number) {
  if(!size){}
  return {
    ...unifiedStore.buffers,
    destroy: () => {}
  };
}