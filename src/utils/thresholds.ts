import { Thresholds } from '../types';

declare global {
  interface Screen {
    refreshRate?: number;
  }
  interface Window {
    _measuredRefreshRate?: number;
  }
}

export function getTargetFrameRate(): number {
  // Try multiple methods to detect refresh rate

  // Method 1: Direct API (rarely supported)
  if (typeof window !== 'undefined' && (window.screen as any)?.refreshRate) {
    return (window.screen as any).refreshRate;
  }

  // Method 2: Check if we have a cached measurement
  if (typeof window !== 'undefined' && (window as any)._measuredRefreshRate) {
    return (window as any)._measuredRefreshRate;
  }

  // Method 3: Try to detect high refresh rate displays by user agent
  if (typeof window !== 'undefined' && navigator.userAgent) {
    // Gaming laptops and monitors often have high refresh rates
    const isGaming = /gaming|rog|alienware|razer|msi/i.test(navigator.userAgent);
    if (isGaming) {
      return 144; // Common gaming refresh rate
    }

    // MacBooks with ProMotion
    const isMacWithProMotion = /macintosh.*apple/i.test(navigator.userAgent) &&
                               window.devicePixelRatio > 2;
    if (isMacWithProMotion) {
      return 120; // ProMotion displays
    }
  }

  // Method 4: Check device pixel ratio as a hint
  if (typeof window !== 'undefined' && window.devicePixelRatio > 2) {
    // High DPI displays are often paired with higher refresh rates
    return 90; // Conservative estimate for high-end displays
  }

  // Default fallback
  return 60;
}

export function calculateThresholds(targetFPS: number): Thresholds {
  const targetMS = 1000 / targetFPS;

  return {
    // FPS thresholds - warn at 80% of target
    fpsWarning: targetFPS * 0.8,
    fpsCritical: targetFPS * 0.5,

    // MS thresholds - warn at 120% of target frame time
    msWarning: targetMS * 1.2,
    msCritical: targetMS * 1.5,

    // GPU thresholds similar to MS
    gpuWarning: targetMS * 1.2,
    gpuCritical: targetMS * 1.5,

    targetFPS,
    targetMS
  };
}