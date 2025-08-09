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
    const oldValue = this.filled ? this.buffer[this.pointer] : 0;
    const needsRecalc = this.filled && (oldValue === this.min || oldValue === this.max);

    // Update buffer and basic stats
    this.buffer[this.pointer] = value;
    
    if (this.filled) {
      this.sum = this.sum - oldValue + value;
    } else {
      this.sum += value;
    }

    // Update pointer and count
    this.pointer = (this.pointer + 1) % this.size;
    if (this.pointer === 0) this.filled = true;
    this.count = this.filled ? this.size : this.pointer;

    // Efficiently update min/max
    if (needsRecalc) {
      // Only recalculate min/max when necessary
      this.recalculateMinMax();
    } else {
      // Fast path: just check against current value
      this.min = Math.min(this.min, value);
      this.max = Math.max(this.max, value);
    }
  }

  private recalculateMinMax(): void {
    this.min = Infinity;
    this.max = -Infinity;
    
    const count = this.count;
    if (count === 0) return;
    
    if (!this.filled) {
      // Unfilled buffer - iterate only over valid values
      for (let i = 0; i < this.pointer; i++) {
        const val = this.buffer[i];
        this.min = Math.min(this.min, val);
        this.max = Math.max(this.max, val);
      }
    } else {
      // Filled buffer - iterate over all values
      for (let i = 0; i < this.size; i++) {
        const val = this.buffer[i];
        this.min = Math.min(this.min, val);
        this.max = Math.max(this.max, val);
      }
    }
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
    this.count = 0;
    
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

  getMin(): number { return this.count > 0 && isFinite(this.min) ? this.min : 0; }  
  getMax(): number { return this.count > 0 && isFinite(this.max) ? this.max : 0; }
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

  destroy(): void {
    this.clear();
  }
}

export const getPoolStats = () => ({ 
  arrayCount: 0, 
  memoryUsage: 0, 
  isActive: false, 
  activeInstances: 0,
  lastUsage: new Date().toISOString()
});