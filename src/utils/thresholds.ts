import { Thresholds } from '../types';

const DEFAULT_TRIANGLES_BUDGET = 1000000;
const DEFAULT_DRAW_CALLS_BUDGET = 500;

let cachedRefreshRate: number | null = null;
let detectionAttempted = false;

function detectRefreshRate(): number | null {
  if (cachedRefreshRate !== null) return cachedRefreshRate;
  if (!detectionAttempted) {
    detectionAttempted = true;
    
    try {
      if (typeof window !== 'undefined' && (window.screen as any)?.refreshRate) {
        const rate = (window.screen as any).refreshRate;
        if (rate && rate > 0) {
          cachedRefreshRate = rate;
          return rate;
        }
      }
      
      if (typeof window !== 'undefined') {
        const highRefreshRates = [165, 144, 120, 90, 75, 72];
        for (const rate of highRefreshRates) {
          const mq = window.matchMedia(`(min-resolution: ${rate - 5}dpi) and (max-resolution: ${rate + 5}dpi)`);
          if (mq.matches) {
            cachedRefreshRate = rate;
            return rate;
          }
        }
        
        if (window.matchMedia('(prefers-reduced-motion: no-preference) and (update: fast)').matches) {
          if (window.devicePixelRatio > 2) {
            cachedRefreshRate = 90;
            return 90;
          }
          cachedRefreshRate = 120;
          return 120;
        }
      }
      
      if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
        (window as any).getScreenDetails?.().then((details: any) => {
          if (details?.currentScreen?.refreshRate) {
            cachedRefreshRate = details.currentScreen.refreshRate;
          }
        }).catch(() => {
          // Ignore
        });
      }
    } catch (e) {
      // Ignore
    }
  }
  
  return null;
}

export function getTargetFrameRate(detectedVsync?: number | null): number {
  if (detectedVsync && detectedVsync > 0) {
    return detectedVsync;
  }

  const earlyDetected = detectRefreshRate();
  if (earlyDetected) {
    return earlyDetected;
  }

  if (typeof window !== 'undefined' && window.devicePixelRatio > 2) {
    return 90;
  }

  return 60;
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