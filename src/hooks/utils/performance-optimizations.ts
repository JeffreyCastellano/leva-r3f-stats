export class BatchedUpdater {
  private updates: Map<string, () => void> = new Map();
  private scheduled = false;

  add(key: string, update: () => void) {
    this.updates.set(key, update);
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    this.updates.forEach(update => update());
    this.updates.clear();
    this.scheduled = false;
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: any;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      lastResult = func.apply(null, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  }) as T;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

export class MovingAverage {
  private samples: Float32Array;
  private pointer = 0;
  private sum = 0;
  private count = 0;

  constructor(private size: number) {
    this.samples = new Float32Array(size);
  }

  add(value: number): number {
    if (this.count === this.size) {
      this.sum -= this.samples[this.pointer];
    } else {
      this.count++;
    }

    this.samples[this.pointer] = value;
    this.sum += value;
    this.pointer = (this.pointer + 1) % this.size;

    return this.sum / this.count;
  }

  get average(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }

  reset(): void {
    this.samples.fill(0);
    this.pointer = 0;
    this.sum = 0;
    this.count = 0;
  }
}