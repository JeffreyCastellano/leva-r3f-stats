import { RingBuffer } from './buffer';

interface VSyncRate {
  refreshRate: number;
  frameTime: number;
  minTime: number; 
  maxTime: number;
}

const VSYNC_RATES: VSyncRate[] = [
  { refreshRate: 30, frameTime: 33.33, minTime: 31.66, maxTime: 35.00 },
  { refreshRate: 60, frameTime: 16.67, minTime: 15.84, maxTime: 17.50 },
  { refreshRate: 72, frameTime: 13.89, minTime: 13.20, maxTime: 14.58 },
  { refreshRate: 75, frameTime: 13.33, minTime: 12.66, maxTime: 14.00 },
  { refreshRate: 90, frameTime: 11.11, minTime: 10.55, maxTime: 11.67 },
  { refreshRate: 120, frameTime: 8.33, minTime: 7.91, maxTime: 8.75 },
  { refreshRate: 144, frameTime: 6.94, minTime: 6.59, maxTime: 7.29 },
  { refreshRate: 165, frameTime: 6.06, minTime: 5.76, maxTime: 6.36 },
  { refreshRate: 240, frameTime: 4.17, minTime: 3.96, maxTime: 4.38 },
  { refreshRate: 360, frameTime: 2.78, minTime: 2.64, maxTime: 2.92 },
];

export class VSyncDetector {
  private enabled: boolean;
  private frameTimeBuffer: RingBuffer;
  private vsyncThreshold: number = 0.05;
  private lastFrameTime: number = 0;
  private detectedVSync: number | null = null;
  private runningSum: number = 0;
  private sampleCount: number = 0;
  private minSamples: number = 30;
  private lastUpdateFrame: number = 0;
  private updateInterval: number = 30;
  private stabilityCounter: number = 0;
  private lastDetectedRate: number | null = null;
  private confidenceThreshold: number = 5;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    this.frameTimeBuffer = new RingBuffer(60);
  }

  update(currentTime: number): number | null {
    if (!this.enabled) {
      return null;
    }

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return this.detectedVSync;
    }

    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    if (frameTime <= 0 || frameTime >= 100) {
      return this.detectedVSync;
    }

    if (this.sampleCount >= this.frameTimeBuffer.size) {
      const oldestValue = this.frameTimeBuffer.getLatest();
      this.runningSum -= oldestValue;
    }
    
    this.frameTimeBuffer.push(frameTime);
    this.runningSum += frameTime;
    this.sampleCount = Math.min(this.sampleCount + 1, this.frameTimeBuffer.size);

    if (this.sampleCount < this.minSamples) {
      return this.detectedVSync;
    }

    this.lastUpdateFrame++;
    if (this.lastUpdateFrame < this.updateInterval) {
      return this.detectedVSync;
    }
    this.lastUpdateFrame = 0;

    const avgFrameTime = this.runningSum / this.sampleCount;
    let detectedRate: number | null = null;
    
    for (const rate of VSYNC_RATES) {
      if (avgFrameTime >= rate.minTime && avgFrameTime <= rate.maxTime) {
        detectedRate = rate.refreshRate;
        break;
      }
    }

    if (!detectedRate) {
      let closestRate: VSyncRate | null = null;
      let smallestDiff = Infinity;

      for (const rate of VSYNC_RATES) {
        const diff = Math.abs(avgFrameTime - rate.frameTime);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestRate = rate;
        }
      }

      if (closestRate && (smallestDiff / closestRate.frameTime <= this.vsyncThreshold)) {
        detectedRate = closestRate.refreshRate;
      } else {
        // Custom rate
        detectedRate = Math.round(1000 / avgFrameTime);
      }
    }

    // Stability check - require consistent detection
    if (detectedRate === this.lastDetectedRate) {
      this.stabilityCounter++;
      if (this.stabilityCounter >= this.confidenceThreshold) {
        this.detectedVSync = detectedRate;
      }
    } else {
      this.stabilityCounter = 0;
      this.lastDetectedRate = detectedRate;
    }

    return this.detectedVSync;
  }

  reset(): void {
    this.frameTimeBuffer.clear();
    this.runningSum = 0;
    this.sampleCount = 0;
    this.lastFrameTime = 0;
    this.detectedVSync = null;
    this.lastUpdateFrame = 0;
    this.stabilityCounter = 0;
    this.lastDetectedRate = null;
  }

  getConfidence(): number {
    if (!this.detectedVSync || this.sampleCount < this.minSamples) {
      return 0;
    }
    
    // Calculate standard deviation for confidence
    const avg = this.runningSum / this.sampleCount;
    let variance = 0;
    let count = 0;
    
    this.frameTimeBuffer.forEachValue((value) => {
      variance += Math.pow(value - avg, 2);
      count++;
    });
    
    if (count === 0) return 0;
    
    const stdDev = Math.sqrt(variance / count);
    const coefficientOfVariation = stdDev / avg;
    
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation * 10));
  }

  isStable(): boolean {
    return this.stabilityCounter >= this.confidenceThreshold && this.getConfidence() > 0.8;
  }
}