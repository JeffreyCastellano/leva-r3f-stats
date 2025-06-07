// src/utils/vsync.ts
export class VSyncDetector {
  private enabled: boolean;
  private samples: number[] = [];
  private readonly SAMPLE_SIZE = 30;
  
  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  update(fps: number): number | null {
    if (!this.enabled || !fps || fps <= 0) return null;
    
    this.samples.push(fps);
    if (this.samples.length > this.SAMPLE_SIZE) {
      this.samples.shift();
    }
    
    if (this.samples.length < this.SAMPLE_SIZE) return null;
    
    const avg = this.samples.reduce((a, b) => a + b) / this.samples.length;
    const refreshRates = [30, 60, 72, 75, 90, 120, 144, 165, 240];
    
    for (const rate of refreshRates) {
      if (Math.abs(avg - rate) < 2) {
        return rate;
      }
    }
    
    return null;
  }
  
  reset(): void {
    this.samples = [];
  }
}