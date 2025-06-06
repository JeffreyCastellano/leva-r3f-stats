// utils/thresholds.ts
import { Thresholds } from '../types';

export function getTargetFrameRate(detectedVsync?: number | null): number {
  if (detectedVsync && detectedVsync > 0) {
    return detectedVsync;
  }

  if (typeof window !== 'undefined' && (window.screen as any)?.refreshRate) {
    return (window.screen as any).refreshRate;
  }

  if (typeof window !== 'undefined' && window.devicePixelRatio > 2) {
    return 90;
  }

  return 60;
}

export function calculateThresholds(targetFPS: number): Thresholds {
  const targetMS = 1000 / targetFPS;

  return {
    fpsWarning: targetFPS * 0.8,
    fpsCritical: targetFPS * 0.5,
    msWarning: targetMS * 1.2,
    msCritical: targetMS * 1.5,
    gpuWarning: targetMS * 1.2,
    gpuCritical: targetMS * 1.5,
    targetFPS,
    targetMS
  };
}