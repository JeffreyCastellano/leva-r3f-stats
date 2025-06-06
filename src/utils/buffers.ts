export class CircularBuffer {
  private buffer: Float32Array;
  private pointer: number = 0;
  public count: number = 0;
  public size: number;

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
    const itemsToAverage = Math.min(this.count, this.size);
    
    for (let i = 0; i < itemsToAverage; i++) {
      const index = (this.pointer - 1 - i + this.size) % this.size;
      sum += this.buffer[index];
    }
    
    return sum / itemsToAverage;
  }

  averageWithoutOutliers(percentile: number = 0.1): number {
    if (this.count === 0) return 0;

    const values: number[] = [];
    const itemsToProcess = Math.min(this.count, this.size);
    
    for (let i = 0; i < itemsToProcess; i++) {
      const index = (this.pointer - 1 - i + this.size) % this.size;
      values.push(this.buffer[index]);
    }

    values.sort((a, b) => a - b);

    const trimCount = Math.floor(itemsToProcess * percentile);
    const start = trimCount;
    const end = itemsToProcess - trimCount;

    if (end <= start) return this.average();

    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += values[i];
    }

    return sum / (end - start);
  }

  getValues(): number[] {
    const values: number[] = [];
    const itemsToGet = Math.min(this.count, this.size);
    
    for (let i = 0; i < itemsToGet; i++) {
      const index = (this.pointer - 1 - i + this.size) % this.size;
      values.push(this.buffer[index]);
    }
    
    return values;
  }

  getPercentile(percentile: number): number {
    if (this.count === 0) return 0;
    
    const values = this.getValues();
    values.sort((a, b) => a - b);
    
    const index = Math.floor(values.length * percentile);
    return values[Math.min(index, values.length - 1)];
  }

  getMin(): number {
    if (this.count === 0) return 0;
    const values = this.getValues();
    return Math.min(...values);
  }

  getMax(): number {
    if (this.count === 0) return 0;
    const values = this.getValues();
    return Math.max(...values);
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

  reset(): void {
    this.value = null;
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
  private allTimeHistory: CircularBuffer; // New: for reporting

  constructor(resetInterval: number = 5000) {
    this.resetInterval = resetInterval;
    this.lastReset = performance.now();
    this.allTimeHistory = new CircularBuffer(1000); // Keep more samples for reporting
  }

  getMin(): number {
    return this.min === Infinity ? 0 : this.min;
  }

  getMax(): number {
    return this.max;
  }

  getCurrent(): number {
    return this.current;
  }

  // New: Get average
  getAverage(): number {
    return this.allTimeHistory.average();
  }

  // New: Get percentile
  getPercentile(percentile: number): number {
    return this.allTimeHistory.getPercentile(percentile);
  }

  // New: Get sample count
  getSampleCount(): number {
    return this.allTimeHistory.count;
  }

  update(value: number): MinMaxData {
    this.current = value;
    this.history.push({ value, time: performance.now() });
    this.allTimeHistory.push(value); // New: track for reporting

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
    this.allTimeHistory = new CircularBuffer(1000); // Reset reporting history too
  }
}

interface MinMaxData {
  min: number;
  max: number;
  current: number;
}