import { useEffect, useRef } from 'react';
import { useThree, useFrame, addAfterEffect } from '@react-three/fiber';
import { useControls } from 'leva';
import { StatsOptions } from '../types';
import { stats } from '../plugin';
import { statsStore } from '../store/statsStore';
import { VSyncDetector } from '../utils/vsync';
import { CircularBuffer, ExponentialMovingAverage } from '../utils/buffers';
import { globalMinMaxTrackers } from '../components/StatsDisplay';

// Add Chrome performance memory extension type
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

declare global {
  interface Window {
    performance: ExtendedPerformance;
    _measuredRefreshRate?: number;
  }
}

// WebGPU state tracking
interface WebGPUState {
  isWebGPU: boolean;
  hasTimestampQuery: boolean;
  warnedAboutCompute: boolean;
}

// Global flag to track if collector is mounted
let globalCollectorMounted = false;

export function useStatsPanel(options: StatsOptions = {}) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const get = useThree(state => state.get);

  // Force unique control name to prevent caching
  const controlKey = useRef(`Performance_${Math.random().toString(36).substr(2, 9)}`);

  // Register the Leva control with unique key and order (defaults to -1 for top placement)
  const controlOptions = options.order !== undefined ? { order: options.order } : { order: -1 };
  useControls({
    [controlKey.current]: stats(options)
  }, controlOptions, []);

  // WebGPU state
  const webGPUState = useRef<WebGPUState>({
    isWebGPU: false,
    hasTimestampQuery: false,
    warnedAboutCompute: false
  });

  // Stats references
  const vsyncDetectorRef = useRef(new VSyncDetector(options?.vsync !== false));
  const statsRef = useRef({
    fps: 0,
    ms: 0,
    memory: 0,
    gpu: 0,
    compute: 0,
    triangles: 0,
    drawCalls: 0,
    vsync: null as number | null,
    isWebGPU: false,

    frames: 0,
    prevTime: performance.now(),
    lastUpdateTime: performance.now(),
    startTime: performance.now(), // Track when we started measuring

    fpsBuffer: new CircularBuffer(30), // Smaller buffer for faster convergence
    frameTimeBuffer: new CircularBuffer(60),
    memoryEMA: new ExponentialMovingAverage(0.1),
    gpuEMA: new ExponentialMovingAverage(0.3),
    computeEMA: new ExponentialMovingAverage(0.3),

    frameTimestamps: [] as number[]
  });

  // For tracking render info - handle both WebGL and WebGPU
  const renderInfoRef = useRef({
    triangles: 0,
    drawCalls: 0,
    lastTriangles: 0,
    lastDrawCalls: 0,
    lastComputeCalls: 0,
    computeTime: 0
  });

  // Mount flag
  useEffect(() => {
    if (!globalCollectorMounted) {
      globalCollectorMounted = true;

      return () => {
        globalCollectorMounted = false;
      };
    }
  }, []);

  // Check for WebGPU support
  useEffect(() => {
    async function checkWebGPU() {
      const renderer = get().gl;
      
      // Reset state
      webGPUState.current = {
        isWebGPU: false,
        hasTimestampQuery: false,
        warnedAboutCompute: false
      };
      
      try {
        // Check if it's a WebGPU renderer
        if (renderer && (renderer as any).isWebGPURenderer) {
          webGPUState.current.isWebGPU = true;
          
          // Try to enable timestamp tracking
          if ((renderer as any).backend) {
            (renderer as any).backend.trackTimestamp = true;
            
            // Check for timestamp-query feature
            if ((renderer as any).hasFeatureAsync) {
              try {
                webGPUState.current.hasTimestampQuery = 
                  await (renderer as any).hasFeatureAsync('timestamp-query');
                
                if (options?.trackCompute && !webGPUState.current.hasTimestampQuery) {
                  console.debug(
                    'leva-r3f-stats: Compute tracking requested but timestamp-query not supported. ' +
                    'Compute metrics will not be displayed.'
                  );
                }
              } catch (e) {
                // Silent fallback if hasFeatureAsync fails
                webGPUState.current.hasTimestampQuery = false;
              }
            }
          }
          
          statsRef.current.isWebGPU = true;
        } else if (options?.trackCompute && !webGPUState.current.warnedAboutCompute) {
          // Only warn once if compute tracking was requested but not available
          console.debug(
            'leva-r3f-stats: Compute tracking requested but WebGPU renderer not detected. ' +
            'Compute metrics will not be displayed.'
          );
          webGPUState.current.warnedAboutCompute = true;
        }
      } catch (error) {
        // Silent fallback on any error
        console.debug('leva-r3f-stats: WebGPU detection failed:', error);
      }
    }
    
    checkWebGPU();
  }, [get, options?.trackCompute]);

  // Reset stats on mount/unmount
  useEffect(() => {
    // Reset everything on mount
    statsStore.update({
      fps: 0,
      ms: 0,
      memory: 0,
      gpu: 0,
      compute: 0,
      triangles: 0,
      drawCalls: 0,
      vsync: null,
      isWebGPU: false
    });

    // Reset min/max trackers
    Object.values(globalMinMaxTrackers).forEach(tracker => tracker.reset());

    return () => {
      // Clean up on unmount
      statsStore.update({
        fps: 0,
        ms: 0,
        memory: 0,
        gpu: 0,
        compute: 0,
        triangles: 0,
        drawCalls: 0,
        vsync: null,
        isWebGPU: false
      });
    };
  }, []);

  // Use R3F's frame loop
  useFrame((state, delta) => {
    const stats = statsRef.current;
    const currentTime = performance.now();

    // Track frame timestamps for accurate FPS calculation
    stats.frameTimestamps.push(currentTime);

    // Keep only timestamps from last second
    const oneSecondAgo = currentTime - 1000;
    stats.frameTimestamps = stats.frameTimestamps.filter(t => t > oneSecondAgo);

    const deltaTime = currentTime - stats.prevTime;

    // Update frame time buffer
    if (deltaTime > 0 && deltaTime < 100) { // Filter out extreme outliers
      stats.frameTimeBuffer.push(deltaTime);
    }

    // Update VSync detection if enabled
    if (options?.vsync !== false) {
      stats.vsync = vsyncDetectorRef.current.update(currentTime);
    } else {
      stats.vsync = null;
    }

    stats.prevTime = currentTime;
  });

  // Use addAfterEffect to capture render info AFTER the frame
  useEffect(() => {
    if (!gl) return;
    
    const unsubscribe = addAfterEffect(() => {
      if (gl.info && gl.info.render) {
        const currentTriangles = gl.info.render.triangles || 0;
        const currentDrawCalls = gl.info.render.calls || 0;
        
        if (webGPUState.current.isWebGPU) {
          // WebGPU: Calculate per-frame deltas
          renderInfoRef.current.triangles = currentTriangles - renderInfoRef.current.lastTriangles;
          renderInfoRef.current.drawCalls = currentDrawCalls - renderInfoRef.current.lastDrawCalls;
          
          // Update last values for next frame
          renderInfoRef.current.lastTriangles = currentTriangles;
          renderInfoRef.current.lastDrawCalls = currentDrawCalls;
          
          // Handle wraparound or reset
          if (renderInfoRef.current.triangles < 0) {
            renderInfoRef.current.triangles = currentTriangles;
            renderInfoRef.current.lastTriangles = 0;
          }
          if (renderInfoRef.current.drawCalls < 0) {
            renderInfoRef.current.drawCalls = currentDrawCalls;
            renderInfoRef.current.lastDrawCalls = 0;
          }
        } else {
          // WebGL: Use values directly (they reset each frame)
          renderInfoRef.current.triangles = currentTriangles;
          renderInfoRef.current.drawCalls = currentDrawCalls;
        }
      }

      // Handle WebGPU timestamp resolution and compute tracking
      if (webGPUState.current.isWebGPU && webGPUState.current.hasTimestampQuery) {
        const renderer = gl;
        
        // Try to resolve timestamps
        if ((renderer as any).resolveTimestampsAsync) {
          // Check if we have new compute calls
          if (options?.trackCompute && (renderer as any).info && (renderer as any).info.compute) {
            const computeInfo = (renderer as any).info.compute;
            const currentComputeCalls = computeInfo.calls || 0;
            
            // Only resolve if we have new compute calls
            if (currentComputeCalls > renderInfoRef.current.lastComputeCalls) {
              renderInfoRef.current.lastComputeCalls = currentComputeCalls;
              
              // Resolve and read timestamp
              Promise.resolve().then(async () => {
                try {
                  await (renderer as any).resolveTimestampsAsync(1); // COMPUTE
                  
                  // Read the timestamp after resolution
                  if (computeInfo.timestamp && computeInfo.timestamp > 0) {
                    renderInfoRef.current.computeTime = computeInfo.timestamp;
                  }
                } catch (e) {
                  // Silent error handling
                }
              });
            }
          }
          
          // Always try to resolve render timestamps
          Promise.resolve().then(async () => {
            try {
              await (renderer as any).resolveTimestampsAsync(0); // RENDER
            } catch (e) {
              // Silent error handling
            }
          });
        }
      }
    });
    
    return () => unsubscribe();
  }, [gl, options?.trackCompute]);

  // Update stats at interval
  useEffect(() => {
    const updateInterval = options?.updateInterval || 100;

    const intervalId = setInterval(() => {
      const stats = statsRef.current;
      const currentTime = performance.now();
      const renderInfo = renderInfoRef.current;

      // Calculate FPS properly
      if (stats.frameTimestamps.length > 0) {
        const timeSpan = currentTime - stats.startTime;
        
        if (timeSpan < 1000) {
          // For the first second, extrapolate based on current performance
          const framesInPeriod = stats.frameTimestamps.length;
          const periodInSeconds = timeSpan / 1000;
          const extrapolatedFPS = Math.round(framesInPeriod / periodInSeconds);
          
          // Push the extrapolated value
          stats.fpsBuffer.push(extrapolatedFPS);
          stats.fps = extrapolatedFPS;
        } else {
          // After first second, use actual frame count
          const actualFPS = stats.frameTimestamps.length;
          stats.fpsBuffer.push(actualFPS);
          stats.fps = Math.round(stats.fpsBuffer.average());
        }
      }

      // Calculate smoothed frame time
      if (stats.frameTimeBuffer.average() > 0) {
        stats.ms = stats.frameTimeBuffer.averageWithoutOutliers(0.05);
      }

      // Update memory
      if ((window.performance as ExtendedPerformance).memory) {
        const currentMemory = Math.round((window.performance as ExtendedPerformance).memory!.usedJSHeapSize / 1048576);
        stats.memory = Math.round(stats.memoryEMA.update(currentMemory));
      }

      // Simple GPU time approximation based on frame time
      if (stats.ms > 0) {
        const gpuTime = stats.ms * 0.7;
        stats.gpu = stats.gpuEMA.update(gpuTime);
      }

      // Use stored compute time
      if (options?.trackCompute && webGPUState.current.isWebGPU && renderInfo.computeTime > 0) {
        stats.compute = stats.computeEMA.update(renderInfo.computeTime);
        
        if (stats.compute > 0) {
          globalMinMaxTrackers.compute.update(stats.compute);
        }
      }

      // Use the calculated render values
      stats.triangles = renderInfo.triangles;
      stats.drawCalls = renderInfo.drawCalls;

      // Update min/max trackers only with valid values
      if (stats.fps > 0) {
        globalMinMaxTrackers.fps.update(stats.fps);
      }
      if (stats.ms > 0) {
        globalMinMaxTrackers.ms.update(stats.ms);
      }
      if (stats.memory > 0) {
        globalMinMaxTrackers.memory.update(stats.memory);
      }
      if (stats.gpu > 0) {
        globalMinMaxTrackers.gpu.update(stats.gpu);
      }
      if (stats.triangles > 0) {
        globalMinMaxTrackers.triangles.update(stats.triangles);
      }
      if (stats.drawCalls > 0) {
        globalMinMaxTrackers.drawCalls.update(stats.drawCalls);
      }

      stats.lastUpdateTime = currentTime;

      // Update the global store
      statsStore.update({
        fps: stats.fps,
        ms: stats.ms,
        memory: stats.memory,
        gpu: stats.gpu,
        compute: stats.compute,
        triangles: stats.triangles,
        drawCalls: stats.drawCalls,
        vsync: stats.vsync,
        isWebGPU: webGPUState.current.isWebGPU
      });
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [options?.updateInterval, options?.trackCompute, gl, get]);

  return null;
}