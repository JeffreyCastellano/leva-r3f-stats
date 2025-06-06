interface VSyncRate {
  refreshRate: number;
  frameTime: number;
}

const VSYNC_RATES: VSyncRate[] = [
  { refreshRate: 30, frameTime: 33.33 },
  { refreshRate: 60, frameTime: 16.67 },
  { refreshRate: 72, frameTime: 13.89 },
  { refreshRate: 75, frameTime: 13.33 },
  { refreshRate: 90, frameTime: 11.11 },
  { refreshRate: 120, frameTime: 8.33 },
  { refreshRate: 144, frameTime: 6.94 },
  { refreshRate: 165, frameTime: 6.06 },
  { refreshRate: 240, frameTime: 4.17 },
  { refreshRate: 360, frameTime: 2.78 },
];

export class VSyncDetector {
  private enabled: boolean;
  private frameTimeHistory: number[] = [];
  private historySize: number = 60;
  private vsyncThreshold: number = 0.05;
  private lastFrameTime: number = 0;
  private detectedVSync: number | null = null;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
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

    if (frameTime > 0 && frameTime < 100) {
      this.frameTimeHistory.push(frameTime);
      if (this.frameTimeHistory.length > this.historySize) {
        this.frameTimeHistory.shift();
      }
    }

    if (this.frameTimeHistory.length < 30) {
      return this.detectedVSync;
    }

    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;

    let closestMatch: VSyncRate | null = null;
    let smallestDiff = Infinity;

    for (const rate of VSYNC_RATES) {
      const diff = Math.abs(avgFrameTime - rate.frameTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestMatch = rate;
      }
    }

    if (closestMatch && (smallestDiff / closestMatch.frameTime <= this.vsyncThreshold)) {
      this.detectedVSync = closestMatch.refreshRate;
    } else {
      const customRate = Math.round(1000 / avgFrameTime);
      this.detectedVSync = customRate;
    }

    return this.detectedVSync;
  }
}