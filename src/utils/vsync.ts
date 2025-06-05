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
  private historySize: number = 120; // 2 seconds at 60fps
  private vsyncThreshold: number = 0.05; // 5% tolerance
  private lastFrameTime: number = 0;
  private detectedVSync: number | null = null;
  private confidence: number = 0;

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

    // Filter out obvious outliers
    if (frameTime > 0 && frameTime < 100) {
      this.frameTimeHistory.push(frameTime);
      if (this.frameTimeHistory.length > this.historySize) {
        this.frameTimeHistory.shift();
      }
    }

    // Need enough samples for reliable detection
    if (this.frameTimeHistory.length < 60) {
      return this.detectedVSync;
    }

    // Calculate statistics
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    const variance = this.frameTimeHistory.reduce((acc, time) =>
      acc + Math.pow(time - avgFrameTime, 2), 0) / this.frameTimeHistory.length;
    const stdDev = Math.sqrt(variance);

    // Calculate confidence based on frame time consistency
    this.confidence = stdDev < 2 ? (1 - stdDev / 2) : 0;

    // Find closest VSync rate
    let closestMatch: VSyncRate | null = null;
    let smallestDiff = Infinity;

    for (const rate of VSYNC_RATES) {
      const diff = Math.abs(avgFrameTime - rate.frameTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestMatch = rate;
      }
    }

    // Check if the match is within threshold
    if (closestMatch && (smallestDiff / closestMatch.frameTime <= this.vsyncThreshold)) {
      this.detectedVSync = closestMatch.refreshRate;
    } else {
      // Custom refresh rate detection
      const customRate = Math.round(1000 / avgFrameTime);
      if (this.confidence > 0.8) {
        this.detectedVSync = customRate;
      }
    }

    return this.detectedVSync;
  }

  getConfidence(): number {
    return this.confidence;
  }
}