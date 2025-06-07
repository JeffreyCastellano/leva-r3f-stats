// src/utils/buffer.ts
export class RingBuffer {
  private buffer: Float32Array;
  private pointer: number = 0;
  private filled: boolean = false;
  public size: number;
  private min: number = Infinity;
  private max: number = -Infinity;
  private sum: number = 0;
  private count: number = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Float32Array(size);
  }

  push(value: number): void {
    // Update min/max/sum incrementally
    if (this.filled) {
      const oldValue = this.buffer[this.pointer];
      this.sum -= oldValue;
      if (oldValue === this.min || oldValue === this.max) {
        this.recalculateStats();
      }
    }

    this.buffer[this.pointer] = value;
    this.sum += value;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    
    this.pointer = (this.pointer + 1) % this.size;
    if (this.pointer === 0) this.filled = true;
    this.count = this.filled ? this.size : this.pointer;
  }

  private recalculateStats(): void {
    this.min = Infinity;
    this.max = -Infinity;
    this.sum = 0;
    this.forEachValue((value) => {
      this.min = Math.min(this.min, value);
      this.max = Math.max(this.max, value);
      this.sum += value;
    });
  }

  resize(newSize: number): void {
    if (newSize === this.size) return;
    
    const oldData = this.getData();
    this.size = newSize;
    this.buffer = new Float32Array(newSize);
    this.pointer = 0;
    this.filled = false;
    this.min = Infinity;
    this.max = -Infinity;
    this.sum = 0;
    
    // Copy most recent data
    const copyCount = Math.min(oldData.length, newSize);
    const startIdx = Math.max(0, oldData.length - copyCount);
    for (let i = 0; i < copyCount; i++) {
      this.push(oldData[startIdx + i]);
    }
  }

  getLatest(): number {
    if (this.count === 0) return 0;
    const index = (this.pointer - 1 + this.size) % this.size;
    return this.buffer[index];
  }

  getData(): Float32Array {
    if (this.count === 0) return new Float32Array(0);
    
    if (!this.filled) {
      return this.buffer.slice(0, this.pointer);
    }
    
    // Reorder circular buffer
    const result = new Float32Array(this.size);
    for (let i = 0; i < this.size; i++) {
      result[i] = this.buffer[(this.pointer + i) % this.size];
    }
    return result;
  }

  forEachValue(callback: (value: number, index: number) => void): void {
    if (this.count === 0) return;

    if (!this.filled) {
      for (let i = 0; i < this.pointer; i++) {
        callback(this.buffer[i], i);
      }
    } else {
      for (let i = 0; i < this.size; i++) {
        callback(this.buffer[(this.pointer + i) % this.size], i);
      }
    }
  }

  getMin(): number { return this.count > 0 ? this.min : 0; }
  getMax(): number { return this.count > 0 ? this.max : 0; }
  getAverage(): number { return this.count > 0 ? this.sum / this.count : 0; }
  getCount(): number { return this.count; }

  clear(): void {
    this.pointer = 0;
    this.filled = false;
    this.min = Infinity;
    this.max = -Infinity;
    this.sum = 0;
    this.count = 0;
  }

  // Add destroy method for compatibility
  destroy(): void {
    this.clear();
  }
}

// Export pool stats stub for compatibility
export const getPoolStats = () => ({ 
  arrayCount: 0, 
  memoryUsage: 0, 
  isActive: false, 
  activeInstances: 0,
  lastUsage: new Date().toISOString()
});