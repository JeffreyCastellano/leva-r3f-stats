// thresholds.ts - Complete file with geometry budgets and refresh rate detection
import { Thresholds } from '../types';

// Default budgets based on common performance targets
const DEFAULT_TRIANGLES_BUDGET = 1000000;  // 1M triangles
const DEFAULT_DRAW_CALLS_BUDGET = 1000;    // 1k draw calls

// Cache the detected refresh rate
let cachedRefreshRate: number | null = null;
let detectionAttempted = false;

// Try to detect refresh rate early using multiple methods
function detectRefreshRate(): number | null {
  if (cachedRefreshRate !== null) return cachedRefreshRate;
  if (!detectionAttempted) {
    detectionAttempted = true;
    
    try {
      // Method 1: Direct screen refresh rate (Chrome 85+)
      if (typeof window !== 'undefined' && (window.screen as any)?.refreshRate) {
        const rate = (window.screen as any).refreshRate;
        if (rate && rate > 0) {
          cachedRefreshRate = rate;
          return rate;
        }
      }
      
      // Method 2: Check common high refresh rate displays
      if (typeof window !== 'undefined') {
        // Use matchMedia to detect high refresh rate
        const highRefreshRates = [165, 144, 120, 90, 75, 72];
        for (const rate of highRefreshRates) {
          const mq = window.matchMedia(`(min-resolution: ${rate - 5}dpi) and (max-resolution: ${rate + 5}dpi)`);
          if (mq.matches) {
            cachedRefreshRate = rate;
            return rate;
          }
        }
        
        // Method 3: Detect via CSS media query for high refresh
        if (window.matchMedia('(prefers-reduced-motion: no-preference) and (update: fast)').matches) {
          // Device supports fast updates, likely > 60Hz
          // Check device pixel ratio for mobile high refresh
          if (window.devicePixelRatio > 2) {
            cachedRefreshRate = 90; // Common mobile high refresh
            return 90;
          }
          cachedRefreshRate = 120; // Common desktop high refresh
          return 120;
        }
      }
      
      // Method 4: Try experimental refresh rate API
      if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
        (window as any).getScreenDetails?.().then((details: any) => {
          if (details?.currentScreen?.refreshRate) {
            cachedRefreshRate = details.currentScreen.refreshRate;
          }
        }).catch(() => {
          // Ignore errors from permission denial
        });
      }
    } catch (e) {
      // Ignore any errors during detection
    }
  }
  
  return null;
}

export function getTargetFrameRate(detectedVsync?: number | null): number {
  // Priority 1: Use detected vsync from our detector
  if (detectedVsync && detectedVsync > 0) {
    return detectedVsync;
  }

  // Priority 2: Use early-detected refresh rate
  const earlyDetected = detectRefreshRate();
  if (earlyDetected) {
    return earlyDetected;
  }

  // Priority 3: Legacy fallback for high DPI displays
  if (typeof window !== 'undefined' && window.devicePixelRatio > 2) {
    return 90;
  }

  // Default fallback
  return 60;
}

export function calculateThresholds(
  targetFPS: number, 
  trianglesBudget?: number,
  drawCallsBudget?: number
): Thresholds {
  const targetMS = 1000 / targetFPS;
  
  // Use provided budgets or defaults
  const trisBudget = trianglesBudget || DEFAULT_TRIANGLES_BUDGET;
  const drawBudget = drawCallsBudget || DEFAULT_DRAW_CALLS_BUDGET;

  return {
    // Frame rate thresholds
    fpsWarning: targetFPS * 0.8,      // 80% of target
    fpsCritical: targetFPS * 0.5,     // 50% of target
    
    // Frame time thresholds
    msWarning: targetMS * 1.2,        // 120% of target
    msCritical: targetMS * 1.5,       // 150% of target
    
    // GPU time thresholds
    gpuWarning: targetMS * 1.2,       // 120% of target
    gpuCritical: targetMS * 1.5,      // 150% of target
    
    // Target values
    targetFPS,
    targetMS,
    
    // Geometry budgets
    trianglesBudget: trisBudget,
    drawCallsBudget: drawBudget,
    
    // Geometry thresholds
    trianglesWarning: trisBudget * 0.8,      // 80% of budget
    trianglesCritical: trisBudget * 1.2,     // 120% of budget
    drawCallsWarning: drawBudget * 0.8,      // 80% of budget
    drawCallsCritical: drawBudget * 1.2      // 120% of budget
  };
}

// Get default thresholds for common performance targets
export function getDefaultThresholds(performanceTarget: 'low' | 'medium' | 'high' = 'medium'): Thresholds {
  const targetFPS = getTargetFrameRate();
  
  switch (performanceTarget) {
    case 'low':
      // Mobile or low-end devices
      return calculateThresholds(targetFPS, 100000, 100);  // 100k tris, 100 draws
      
    case 'high':
      // High-end desktop
      return calculateThresholds(targetFPS, 5000000, 5000); // 5M tris, 5k draws
      
    case 'medium':
    default:
      // Standard desktop
      return calculateThresholds(targetFPS, 1000000, 1000); // 1M tris, 1k draws
  }
}

// Export for debugging
export function getDetectedRefreshRate(): number | null {
  return cachedRefreshRate;
}

// Allow manual override for testing
export function setRefreshRateOverride(rate: number | null): void {
  cachedRefreshRate = rate;
}

// Get default budgets
export function getDefaultBudgets(): { triangles: number; drawCalls: number } {
  return {
    triangles: DEFAULT_TRIANGLES_BUDGET,
    drawCalls: DEFAULT_DRAW_CALLS_BUDGET
  };
}

// Calculate budget from current performance
export function calculateAdaptiveBudget(
  currentFPS: number,
  targetFPS: number,
  currentTriangles: number,
  currentDrawCalls: number
): { triangles: number; drawCalls: number } {
  // If we're hitting target FPS, we can potentially increase budget
  const performanceRatio = currentFPS / targetFPS;
  
  if (performanceRatio > 1.1) {
    // Running 10% above target, can increase budget
    return {
      triangles: Math.round(currentTriangles * 1.2),
      drawCalls: Math.round(currentDrawCalls * 1.2)
    };
  } else if (performanceRatio < 0.9) {
    // Running below 90% of target, should decrease budget
    return {
      triangles: Math.round(currentTriangles * 0.8),
      drawCalls: Math.round(currentDrawCalls * 0.8)
    };
  }
  
  // Performance is acceptable, keep current as budget
  return {
    triangles: currentTriangles,
    drawCalls: currentDrawCalls
  };
}

// Utility to format budget values for display
export function formatBudget(value: number, budget: number): string {
  const percentage = (value / budget) * 100;
  return `${percentage.toFixed(0)}%`;
}

// Check if value exceeds budget thresholds
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