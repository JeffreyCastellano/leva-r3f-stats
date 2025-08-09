import { Thresholds } from '../types';

const DEFAULT_TRIANGLES_BUDGET = 1000000;
const DEFAULT_DRAW_CALLS_BUDGET = 500;

let cachedRefreshRate: number | null = null;
let detectionAttempted = false;
let rafDetectedRate: number | null = null;

// Reset cached refresh rate to force re-detection
export function resetRefreshRateCache(): void {
  cachedRefreshRate = null;
  detectionAttempted = false;
  rafDetectedRate = null;
}

// Detect refresh rate using requestAnimationFrame timing
export function detectRefreshRateViaRAF(callback?: (rate: number) => void): void {
  if (typeof window === 'undefined' || rafDetectedRate !== null) {
    if (callback && rafDetectedRate) callback(rafDetectedRate);
    return;
  }

  const samples: number[] = [];
  let lastTime = performance.now();
  let frameCount = 0;
  const targetSamples = 60; // Collect 60 frame samples

  const measure = () => {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    
    if (frameCount > 0 && delta > 0) { // Skip first frame
      samples.push(delta);
    }
    
    lastTime = currentTime;
    frameCount++;

    if (frameCount <= targetSamples) {
      requestAnimationFrame(measure);
    } else {
      // Calculate average frame time and derive refresh rate
      const avgFrameTime = samples.reduce((a, b) => a + b, 0) / samples.length;
      const detectedFPS = Math.round(1000 / avgFrameTime);
      
      // Snap to common refresh rates
      const commonRates = [30, 60, 72, 75, 90, 120, 144, 165, 240];
      let closestRate = 60;
      let minDiff = Infinity;
      
      for (const rate of commonRates) {
        const diff = Math.abs(detectedFPS - rate);
        if (diff < minDiff && diff <= 5) { // Within 5 FPS tolerance
          minDiff = diff;
          closestRate = rate;
        }
      }
      
      rafDetectedRate = closestRate;
      cachedRefreshRate = closestRate;
      if (callback) callback(closestRate);
    }
  };

  requestAnimationFrame(measure);
}

function detectRefreshRate(): number | null {
  if (cachedRefreshRate !== null) return cachedRefreshRate;
  if (!detectionAttempted) {
    detectionAttempted = true;
    
    try {
      // Try modern Screen API first
      if (typeof window !== 'undefined' && (window.screen as any)?.refreshRate) {
        const rate = (window.screen as any).refreshRate;
        if (rate && rate > 0) {
          cachedRefreshRate = rate;
          return rate;
        }
      }
      
      // Try experimental getScreenDetails API
      if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
        (window as any).getScreenDetails?.().then((details: any) => {
          if (details?.currentScreen?.refreshRate) {
            cachedRefreshRate = details.currentScreen.refreshRate;
          }
        }).catch(() => {
          // Ignore - API might not be available or permission denied
        });
      }
      
      // Start RAF-based detection in background
      detectRefreshRateViaRAF();
      
      // Use media query hints as immediate fallback
      if (typeof window !== 'undefined') {
        const highRefreshRates = [240, 165, 144, 120, 90, 75, 72];
        for (const rate of highRefreshRates) {
          const mq = window.matchMedia(`(min-resolution: ${rate - 5}dpi) and (max-resolution: ${rate + 5}dpi)`);
          if (mq.matches) {
            cachedRefreshRate = rate;
            return rate;
          }
        }
        
        // Check for high refresh rate displays using update media query
        if (window.matchMedia('(prefers-reduced-motion: no-preference) and (update: fast)').matches) {
          // Likely a gaming monitor or high-end display
          if (window.devicePixelRatio > 2) {
            // High DPI display, possibly mobile or MacBook Pro
            return 120;
          }
          // Standard high refresh display
          return 144;
        }
      }
    } catch (e) {
      // Ignore errors in detection
    }
  }
  
  // Return RAF-detected rate if available
  if (rafDetectedRate !== null) {
    return rafDetectedRate;
  }
  
  return null;
}

export function getTargetFrameRate(detectedVsync?: number | null): number {
  // Priority 1: Use vsync-detected rate if available
  if (detectedVsync && detectedVsync > 0) {
    return detectedVsync;
  }

  // Priority 2: Use detected refresh rate from various methods
  const earlyDetected = detectRefreshRate();
  if (earlyDetected) {
    return earlyDetected;
  }

  // Priority 3: Try to detect dynamically if not done yet
  if (typeof window !== 'undefined' && !detectionAttempted) {
    // Start detection process
    detectRefreshRate();
    
    // Use temporary default based on device hints while detection runs
    if (window.devicePixelRatio > 2) {
      // High DPI displays often have higher refresh rates
      return 120;
    }
    
    // Check for performance hints
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return 30; // User prefers reduced motion
    }
  }

  // Priority 4: Use the most common refresh rate as final fallback
  // Note: This should rarely be reached as detection usually succeeds
  return typeof window !== 'undefined' ? 60 : 60;
}

export function calculateThresholds(
  targetFPS: number, 
  trianglesBudget?: number,
  drawCallsBudget?: number
): Thresholds {
  const targetMS = 1000 / targetFPS;
  
  const trisBudget = trianglesBudget || DEFAULT_TRIANGLES_BUDGET;
  const drawBudget = drawCallsBudget || DEFAULT_DRAW_CALLS_BUDGET;

  return {
    fpsWarning: targetFPS * 0.8,      // 80% of target
    fpsCritical: targetFPS * 0.5,     // 50% of target
    
    msWarning: targetMS * 1.2,        // 120% of target
    msCritical: targetMS * 1.5,       // 150% of target
    
    gpuWarning: targetMS * 1.2,       // 120% of target
    gpuCritical: targetMS * 1.5,      // 150% of target
    
    targetFPS,
    targetMS,
    
    trianglesBudget: trisBudget,
    drawCallsBudget: drawBudget,
    
    trianglesWarning: trisBudget * 0.8,      // 80% of budget
    trianglesCritical: trisBudget * 1.2,     // 120% of budget
    drawCallsWarning: drawBudget * 0.8,      // 80% of budget
    drawCallsCritical: drawBudget * 1.2      // 120% of budget
  };
}

export function getDefaultThresholds(performanceTarget: 'low' | 'medium' | 'high' = 'medium'): Thresholds {
  const targetFPS = getTargetFrameRate();
  
  switch (performanceTarget) {
    case 'low':
      return calculateThresholds(targetFPS, 100000, 100);  // 100k tris, 100 draws
      
    case 'high':
      return calculateThresholds(targetFPS, 5000000, 5000); // 5M tris, 5k draws
      
    case 'medium':
    default:
      return calculateThresholds(targetFPS, 1000000, 1000); // 1M tris, 1k draws
  }
}

export function getDetectedRefreshRate(): number | null {
  return cachedRefreshRate;
}

export function setRefreshRateOverride(rate: number | null): void {
  cachedRefreshRate = rate;
}

export function getDefaultBudgets(): { triangles: number; drawCalls: number } {
  return {
    triangles: DEFAULT_TRIANGLES_BUDGET,
    drawCalls: DEFAULT_DRAW_CALLS_BUDGET
  };
}

export function calculateAdaptiveBudget(
  currentFPS: number,
  targetFPS: number,
  currentTriangles: number,
  currentDrawCalls: number
): { triangles: number; drawCalls: number } {
  const performanceRatio = currentFPS / targetFPS;
  
  if (performanceRatio > 1.1) {
    // Running 10% above target
    return {
      triangles: Math.round(currentTriangles * 1.2),
      drawCalls: Math.round(currentDrawCalls * 1.2)
    };
  } else if (performanceRatio < 0.9) {
    // Running below 90% of target
    return {
      triangles: Math.round(currentTriangles * 0.8),
      drawCalls: Math.round(currentDrawCalls * 0.8)
    };
  }
  
  return {
    triangles: currentTriangles,
    drawCalls: currentDrawCalls
  };
}

export function formatBudget(value: number, budget: number): string {
  const percentage = (value / budget) * 100;
  return `${percentage.toFixed(0)}%`;
}

export function checkBudgetStatus(
  value: number, 
  budget: number, 
  warningPercent: number = 80, 
  criticalPercent: number = 120
): 'ok' | 'warning' | 'critical' {
  const percentage = (value / budget) * 100;
  
  if (percentage >= criticalPercent) return 'critical';
  if (percentage >= warningPercent) return 'warning';
  return 'ok';
}