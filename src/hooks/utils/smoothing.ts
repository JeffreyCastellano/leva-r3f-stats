export class NoiseFilter {
    private lastValue: number = 0;
    private threshold: number;
    
    constructor(threshold: number = 0.01) {
      this.threshold = threshold;
    }
    
    filter(value: number): number {
      // Only update if change is significant
      if (Math.abs(value - this.lastValue) > this.threshold) {
        this.lastValue = value;
      }
      return this.lastValue;
    }
  }
  
export class EMASmoothing {
    private value: number = 0;
    private initialized: boolean = false;
    
    constructor(private alpha: number = 0.1) {} // Lower alpha = more smoothing
    
    update(newValue: number): number {
      if (!this.initialized) {
        this.value = newValue;
        this.initialized = true;
        return newValue;
      }
      
      // Exponential moving average
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
      return this.value;
    }
    
    reset(): void {
      this.initialized = false;
      this.value = 0;
    }
  }

  export class StatsSmoothing {
    private smoothers = new Map<string, EMASmoothing>();
    private filters = new Map<string, NoiseFilter>();
    private readonly alphas = {
      fps: 0.05,      // Very smooth (more stable)
      ms: 0.05,       // Very smooth
      memory: 0.02,   // Extra smooth (memory changes slowly)
      gpu: 0.08,      // Smooth
      cpu: 0.08,      // Smooth
      compute: 0.08,  // Smooth
      triangles: 0.15, // Less smooth (geometry can change quickly)
      drawCalls: 0.15  // Less smooth
    };
    
    constructor(customAlphas?: Partial<typeof this.alphas>) {
      if (customAlphas) {
        Object.assign(this.alphas, customAlphas);
      }
    }
    
    smooth(metric: string, value: number): number {
        if (!this.smoothers.has(metric)) {
          const alpha = this.alphas[metric as keyof typeof this.alphas] || 0.1;
          this.smoothers.set(metric, new EMASmoothing(alpha));
          
          // Add noise filter with metric-specific thresholds
          const threshold = metric === 'memory' ? 0.5 : 0.01;
          this.filters.set(metric, new NoiseFilter(threshold));
        }
        
        // First smooth, then filter noise
        const smoothed = this.smoothers.get(metric)!.update(value);
        return this.filters.get(metric)!.filter(smoothed);
      }
    
    reset(): void {
      this.smoothers.forEach(smoother => smoother.reset());
    }
  }