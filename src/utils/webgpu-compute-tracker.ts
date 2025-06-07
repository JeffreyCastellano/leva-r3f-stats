import { useCallback } from 'react';

interface ComputeTimingOptions {
  name?: string;
  autoReport?: boolean;
}

export async function trackComputeTime<T>(
  renderer: any,
  computeFn: () => Promise<T>,
  options: ComputeTimingOptions = {}
): Promise<{ result: T; elapsed: number }> {
  const { name = 'compute', autoReport = true } = options;
  
  const startTime = performance.now();
  
  try {
    const result = await computeFn();
    const elapsed = performance.now() - startTime;
    
    if (autoReport && renderer?.info) {
      if (!renderer.info[name]) {
        renderer.info[name] = {};
      }
      renderer.info[name].timestamp = elapsed;
    }
    
    return { result, elapsed };
  } catch (error) {
    const elapsed = performance.now() - startTime;
    
    if (autoReport && renderer?.info) {
      if (!renderer.info[name]) {
        renderer.info[name] = {};
      }
      renderer.info[name].timestamp = elapsed;
      renderer.info[name].error = true;
    }
    
    throw error;
  }
}

export function withComputeTiming<TArgs extends any[], TResult>(
  renderer: any,
  computeFn: (...args: TArgs) => Promise<TResult>,
  options: ComputeTimingOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const { result } = await trackComputeTime(
      renderer,
      () => computeFn(...args),
      options
    );
    return result;
  };
}

export function useComputeTracker(renderer: any, options: ComputeTimingOptions = {}) {
  return useCallback(
    <T>(computeFn: () => Promise<T>) => trackComputeTime(renderer, computeFn, options),
    [renderer, options]
  );
}