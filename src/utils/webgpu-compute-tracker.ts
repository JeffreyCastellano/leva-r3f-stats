// utils/webgpu-compute-tracker.ts
import { useCallback } from 'react';

interface ComputeTimingOptions {
    name?: string;
    autoReport?: boolean;
  }
  
  /**
   * Tracks WebGPU compute timing and automatically reports it to the renderer's info object
   * 
   * @param renderer - The WebGPU renderer instance
   * @param computeFn - The async function that runs compute operations
   * @param options - Optional configuration
   * @returns The result of the compute function and the elapsed time
   * 
   * @example
   * ```typescript
   * useFrame(async (state, delta) => {
   *   const { result, elapsed } = await trackComputeTime(
   *     renderer,
   *     async () => {
   *       for (let i = 0; i < passes; i++) {
   *         await renderer.computeAsync(kernels);
   *       }
   *     }
   *   );
   * });
   * ```
   */
  export async function trackComputeTime<T>(
    renderer: any,
    computeFn: () => Promise<T>,
    options: ComputeTimingOptions = {}
  ): Promise<{ result: T; elapsed: number }> {
    const { name = 'compute', autoReport = true } = options;
    
    const startTime = performance.now();
    
    try {
      // Run the compute function
      const result = await computeFn();
      
      // Calculate elapsed time
      const elapsed = performance.now() - startTime;
      
      // Auto-report to renderer.info if enabled
      if (autoReport && renderer?.info) {
        if (!renderer.info[name]) {
          renderer.info[name] = {};
        }
        renderer.info[name].timestamp = elapsed;
      }
      
      return { result, elapsed };
    } catch (error) {
      // Even on error, report the timing
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
  
  /**
   * Higher-order function that wraps a compute function with automatic timing
   * 
   * @example
   * ```typescript
   * const timedCompute = withComputeTiming(renderer, async (kernels, passes) => {
   *   for (let i = 0; i < passes; i++) {
   *     await renderer.computeAsync(kernels);
   *   }
   * });
   * 
   * // Later in useFrame:
   * await timedCompute(kernels, controls.computePasses);
   * ```
   */
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
  
  /**
   * React hook for tracking compute time
   * 
   * @example
   * ```typescript
   * const trackCompute = useComputeTracker(renderer);
   * 
   * useFrame(async () => {
   *   await trackCompute(async () => {
   *     // Your compute code here
   *   });
   * });
   * ```
   */
  export function useComputeTracker(renderer: any, options: ComputeTimingOptions = {}) {
    return useCallback(
      <T>(computeFn: () => Promise<T>) => trackComputeTime(renderer, computeFn, options),
      [renderer, options]
    );
  }