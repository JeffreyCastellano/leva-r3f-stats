export class CircularBuffer {
    private buffer: Float32Array;
    private pointer: number = 0;
    private count: number = 0;
    private size: number;
  
    constructor(size: number) {
      this.buffer = new Float32Array(size);
      this.size = size;
    }
  
    push(value: number): void {
      this.buffer[this.pointer] = value;
      this.pointer = (this.pointer + 1) % this.size;
      this.count = Math.min(this.count + 1, this.size);
    }
  
    average(): number {
      if (this.count === 0) return 0;
      let sum = 0;
      for (let i = 0; i < this.count; i++) {
        sum += this.buffer[i];
      }
      return sum / this.count;
    }
  
    averageWithoutOutliers(percentile: number = 0.1): number {
      if (this.count === 0) return 0;
  
      const values: number[] = [];
      for (let i = 0; i < this.count; i++) {
        values.push(this.buffer[i]);
      }
  
      values.sort((a, b) => a - b);
  
      const trimCount = Math.floor(this.count * percentile);
      const start = trimCount;
      const end = this.count - trimCount;
  
      if (end <= start) return this.average();
  
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += values[i];
      }
  
      return sum / (end - start);
    }
  }
  
  export class ExponentialMovingAverage {
    private alpha: number;
    private value: number | null = null;
  
    constructor(alpha: number = 0.2) {
      this.alpha = alpha;
    }
  
    update(newValue: number): number {
      if (this.value === null) {
        this.value = newValue;
      } else {
        this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
      }
      return this.value;
    }
  
    get(): number {
      return this.value || 0;
    }
  }
  
  export class MinMaxTracker {
    private min: number = Infinity;
    private max: number = 0;
    private current: number = 0;
    private lastReset: number;
    private resetInterval: number;
    private history: Array<{ value: number; time: number }> = [];
    private historySize: number = 300; // 5 seconds at 60fps
  
    constructor(resetInterval: number = 5000) {
      this.resetInterval = resetInterval;
      this.lastReset = performance.now();
    }
  
    getMin(): number {
      return this.min;
    }
  
    getMax(): number {
      return this.max;
    }
  
    getCurrent(): number {
      return this.current;
    }
  
    update(value: number): MinMaxData {
      this.current = value;
      this.history.push({ value, time: performance.now() });
  
      // Clean old entries
      const cutoffTime = performance.now() - this.resetInterval;
      this.history = this.history.filter(entry => entry.time > cutoffTime);
  
      // Recalculate min/max from recent history
      if (this.history.length > 0) {
        this.min = Math.min(...this.history.map(e => e.value));
        this.max = Math.max(...this.history.map(e => e.value));
      } else {
        this.min = value;
        this.max = value;
      }
  
      return {
        min: this.min,
        max: this.max,
        current: this.current
      };
    }
  
    reset(): void {
      this.min = this.current;
      this.max = this.current;
      this.history = [];
      this.lastReset = performance.now();
    }
  }
  
  interface MinMaxData {
    min: number;
    max: number;
    current: number;
  }