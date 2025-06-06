// src/hooks/useStatsPanel.ts
import { useEffect, useRef } from 'react';
import { useThree, useFrame, addAfterEffect } from '@react-three/fiber';
import { useControls } from 'leva';
import { StatsOptions, GPUTimingState } from '../types';
import { stats } from '../plugin';
import { statsStore } from '../store/statsStore';
import { VSyncDetector } from '../utils/vsync';
import { globalBuffers } from '../store/globalBuffers';

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
  }
}

interface WebGPUState {
  isWebGPU: boolean;
  hasTimestampQuery: boolean;
}

let globalCollectorInstances = 0;

export function useStatsPanel(options: StatsOptions = {}) {
  const gl = useThree(state => state.gl);
  const get = useThree(state => state.get);

  const controlKey = useRef(`Performance_${Math.random().toString(36).substr(2, 9)}`);
  const createdQueries = useRef<WebGLQuery[]>([]);
  
  const folderSettings = options.folder 
    ? typeof options.folder === 'string' 
      ? { [options.folder]: { collapsed: false } }
      : { [options.folder.name]: { collapsed: options.folder.collapsed ?? false } }
    : undefined;
  
  const statsControl = stats(options);
  const controls:any = options.folder
    ? typeof options.folder === 'string'
      ? { [options.folder]: { [controlKey.current]: statsControl } }
      : { [options.folder.name]: { [controlKey.current]: statsControl } }
    : { [controlKey.current]: statsControl };

  const controlOptions = options.order !== undefined ? { order: options.order } : { order: -1 };
  useControls(controls, { ...controlOptions, ...folderSettings }, []);

  const webGPUState = useRef<WebGPUState>({
    isWebGPU: false,
    hasTimestampQuery: false
  });

  const gpuTimingState = useRef<GPUTimingState>({
    available: false,
    ext: null,
    query: null,
    queryInProgress: false,
    lastGPUTime: 0
  });

  const vsyncDetectorRef = useRef(new VSyncDetector(options?.vsync !== false));
  
  const statsRef = useRef({
    fps: 0,
    ms: 0,
    memory: 0,
    gpu: 0,
    cpu: 0,
    compute: 0,
    triangles: 0,
    drawCalls: 0,
    vsync: null as number | null,
    isWebGPU: false,
    gpuAccurate: false,

    frames: 0,
    prevTime: performance.now(),
    lastUpdateTime: performance.now(),
    startTime: performance.now(),

    frameTimestamps: [] as number[],
    lastRenderTime: 0,
    
    fpsSmooth: 0,
    msSmooth: 0,
    gpuSmooth: 0,
    cpuSmooth: 0,
    computeSmooth: 0,
    
    frameStartTime: 0,
    frameEndTime: 0
  });

  
  useEffect(() => {
    globalCollectorInstances++;
    if (globalCollectorInstances > 1) {
      console.warn('Multiple Stats instances detected. Only one instance should be active.');
    }
    return () => {
      globalCollectorInstances--;
    };
  }, []);

  useEffect(() => {
    if (!gl) return;

    const isWebGPU = !!(gl && (gl as any).isWebGPURenderer);
    
    if (isWebGPU) {
      webGPUState.current.isWebGPU = true;
      statsRef.current.isWebGPU = true;
      
      if ((gl as any).backend) {
        (gl as any).backend.trackTimestamp = true;
      }
      
      console.log('WebGPU renderer detected, skipping WebGL extension initialization');
      return;
    }

    try {
      const context = gl.getContext();
      if (!context || typeof context.getExtension !== 'function') return;

      const ext = context.getExtension('EXT_disjoint_timer_query_webgl2');
      if (ext) {
        gpuTimingState.current = {
          available: true,
          ext,
          query: null,
          queryInProgress: false,
          lastGPUTime: 0
        };
      }
    } catch (error) {
      console.debug('GPU timing init failed:', error);
    }
  }, [gl]);

  useEffect(() => {
    async function checkWebGPU() {
      const renderer = get().gl;
      
      if (!webGPUState.current.isWebGPU) {
        webGPUState.current = {
          isWebGPU: false,
          hasTimestampQuery: false
        };
      }
      
      try {
        if (renderer && (renderer as any).isWebGPURenderer) {
          webGPUState.current.isWebGPU = true;
          
          if ((renderer as any).backend) {
            (renderer as any).backend.trackTimestamp = true;
            
            if ((renderer as any).hasFeatureAsync) {
              try {
                webGPUState.current.hasTimestampQuery = 
                  await (renderer as any).hasFeatureAsync('timestamp-query');
              } catch (e) {
                webGPUState.current.hasTimestampQuery = false;
              }
            }
          }
          
          statsRef.current.isWebGPU = true;
        }
      } catch (error) {
        console.debug('WebGPU detection failed:', error);
      }
    }
    
    checkWebGPU();
  }, [get]);

  useFrame((_state, delta) => {
    const stats = statsRef.current;
    const currentTime = performance.now();

    stats.frameStartTime = currentTime;
    stats.frameTimestamps.push(currentTime);

    const oneSecondAgo = currentTime - 1000;
    stats.frameTimestamps = stats.frameTimestamps.filter(t => t > oneSecondAgo);

    stats.fps = stats.frameTimestamps.length;

    const frameTime = currentTime - stats.prevTime;
    if (frameTime > 0 && frameTime < 100) {
      stats.ms = frameTime;
      globalBuffers.ms.push(frameTime);
    }

    if (options?.vsync !== false) {
      stats.vsync = vsyncDetectorRef.current.update(currentTime);
    }

    const cpuTime = delta * 1000;
    if (cpuTime > 0 && cpuTime < 100) {
      stats.cpu = cpuTime;
      globalBuffers.cpu.push(cpuTime);
    }

    stats.prevTime = currentTime;
  });


useEffect(() => {
  if (!gl.info || webGPUState.current.isWebGPU) return;
  
  if (options?.aggressiveCount) {
    // Aggressive mode: Accumulate all geometry processed in a frame
    let frameAccumulator = {
      triangles: 0,
      drawCalls: 0,
      renderCount: 0
    };
    
    const originalUpdate = gl.info.update;
    gl.info.update = function(count, mode, instanceCount) {
      originalUpdate.call(this, count, mode, instanceCount);
      
      const triangles = count / 3;
      frameAccumulator.triangles += triangles;
      frameAccumulator.drawCalls++;
    };
    
    const unsubscribe = addAfterEffect(() => {
      if (frameAccumulator.drawCalls > 0) {
        statsRef.current.triangles = frameAccumulator.triangles;
        statsRef.current.drawCalls = frameAccumulator.drawCalls;
        
        frameAccumulator = {
          triangles: 0,
          drawCalls: 0,
          renderCount: 0
        };
      }
    });
    
    return () => {
      gl.info.update = originalUpdate;
      unsubscribe();
    };
  } else {
    let peakStats = { triangles: 0, drawCalls: 0 };
    
    const originalUpdate = gl.info.update;
    gl.info.update = function(count, mode, instanceCount) {
      originalUpdate.call(this, count, mode, instanceCount);
      
      peakStats.triangles = Math.max(peakStats.triangles, this.render.triangles);
      peakStats.drawCalls = Math.max(peakStats.drawCalls, this.render.calls);
    };
    
    const unsubscribe = addAfterEffect(() => {
      if (peakStats.triangles > 0 || peakStats.drawCalls > 0) {
        statsRef.current.triangles = peakStats.triangles;
        statsRef.current.drawCalls = peakStats.drawCalls;
        
        peakStats = { triangles: 0, drawCalls: 0 };
      }
    });
    
    return () => {
      gl.info.update = originalUpdate;
      unsubscribe();
    };
  }
}, [gl, options?.aggressiveCount]);

  useEffect(() => {
    if (!gpuTimingState.current.available || webGPUState.current.isWebGPU) return;

    const checkGPUResults = () => {
      const gpuTiming = gpuTimingState.current;
      const gl2 = gl.getContext() as WebGL2RenderingContext;
      
      if (!gl2 || !gpuTiming.ext) return;

      if (!gpuTiming.queryInProgress && gpuTiming.ext) {
        try {
          const disjoint = gl2.getParameter(gpuTiming.ext.GPU_DISJOINT_EXT);
          if (!disjoint) {
            const query = gl2.createQuery();
            if (query) {
              createdQueries.current.push(query);
              gpuTiming.query = query;
              gl2.beginQuery(gpuTiming.ext.TIME_ELAPSED_EXT, query);
              gpuTiming.queryInProgress = true;
            }
          } else {
            console.debug('GPU disjoint detected, skipping frame');
          }
        } catch (error) {
          console.debug('GPU query start failed:', error);
        }
      }

      if (gpuTiming.queryInProgress && gpuTiming.query) {
        try {
          const available = gl2.getQueryParameter(
            gpuTiming.query,
            gl2.QUERY_RESULT_AVAILABLE
          );
          
          if (available) {
            const disjoint = gl2.getParameter(gpuTiming.ext.GPU_DISJOINT_EXT);
            
            if (!disjoint) {
              const gpuTime = gl2.getQueryParameter(
                gpuTiming.query,
                gl2.QUERY_RESULT
              );
              
              const gpuMs = gpuTime / 1000000;
              
              if (gpuMs > 0 && gpuMs < 1000) {
                statsRef.current.gpu = gpuMs;
                statsRef.current.gpuAccurate = true;
                globalBuffers.gpu.push(gpuMs);
              }
            } else {
              console.debug('GPU disjoint detected during result read');
            }
            
            // Remove from tracked queries
            const queryIndex = createdQueries.current.indexOf(gpuTiming.query);
            if (queryIndex > -1) {
              createdQueries.current.splice(queryIndex, 1);
            }
            
            gl2.deleteQuery(gpuTiming.query);
            gpuTiming.query = null;
            gpuTiming.queryInProgress = false;
          }
        } catch (error) {
          console.debug('GPU query check failed:', error);
          if (gpuTiming.query) {
            try {
              // Remove from tracked queries
              const queryIndex = createdQueries.current.indexOf(gpuTiming.query);
              if (queryIndex > -1) {
                createdQueries.current.splice(queryIndex, 1);
              }
              gl2.deleteQuery(gpuTiming.query);
            } catch (e) {
            }
          }
          gpuTiming.query = null;
          gpuTiming.queryInProgress = false;
        }
      }
    };

    const endQuery = addAfterEffect(() => {
      const gpuTiming = gpuTimingState.current;
      const gl2 = gl.getContext() as WebGL2RenderingContext;
      
      if (gpuTiming.queryInProgress && gpuTiming.ext && gl2) {
        try {
          gl2.endQuery(gpuTiming.ext.TIME_ELAPSED_EXT);
        } catch (error) {
          console.debug('GPU query end failed:', error);
        }
      }
    });

    const intervalId = setInterval(checkGPUResults, 16);

    return () => {
      clearInterval(intervalId);
      endQuery();
    };
  }, [gl]);

  useEffect(() => {
    if (!webGPUState.current.isWebGPU) {
      return;
    }

    const renderer = get().gl;
    let intervalId: NodeJS.Timeout;
    let lastDrawCalls = 0;
    let lastTriangles = 0;

    const resolveTimestamps = () => {
      try {
        if (!(renderer as any).info) {
          console.warn('No renderer.info found');
          return;
        }

        // GPU timing
        if ((renderer as any).info.render?.timestamp !== undefined) {
          const gpuTime = (renderer as any).info.render.timestamp;
          if (typeof gpuTime === 'number' && gpuTime > 0) {
            statsRef.current.gpu = gpuTime;
            statsRef.current.gpuAccurate = true;
            globalBuffers.gpu.push(gpuTime);
          }
        }
        
        // Compute timing
        if (options?.trackCompute && (renderer as any).info.compute?.timestamp !== undefined) {
          const computeTime = (renderer as any).info.compute.timestamp;
          if (typeof computeTime === 'number' && computeTime > 0) {
            statsRef.current.compute = computeTime;
            globalBuffers.compute.push(computeTime);
          }
        }

        if ((renderer as any).info.render) {
          const currentCalls = (renderer as any).info.render.calls || 0;
          const currentTriangles = (renderer as any).info.render.triangles || 0;
          
          if (lastDrawCalls > 0 && currentCalls >= lastDrawCalls) {
            statsRef.current.drawCalls = currentCalls - lastDrawCalls;
          } else {
            statsRef.current.drawCalls = currentCalls;
          }
          
          if (lastTriangles > 0 && currentTriangles >= lastTriangles) {
            statsRef.current.triangles = currentTriangles - lastTriangles;
          } else {
            statsRef.current.triangles = currentTriangles;
          }
          
          lastDrawCalls = currentCalls;
          lastTriangles = currentTriangles;
        }
      } catch (error) {
        console.warn('Error reading WebGPU stats:', error);
      }
    };

    intervalId = setInterval(resolveTimestamps, 16); // ~60fps

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [get, options?.trackCompute]);

  useEffect(() => {
    const updateInterval = options?.updateInterval || 100;

    const intervalId = setInterval(() => {
      const stats = statsRef.current;

      if (window.performance?.memory) {
        const memory = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
        stats.memory = memory;
        globalBuffers.memory.push(memory);
      }

      if (!stats.gpuAccurate && stats.ms > 0) {
        const estimatedGPU = stats.ms * 0.7;
        stats.gpu = estimatedGPU;
        globalBuffers.gpu.push(estimatedGPU);
      }

      globalBuffers.fps.push(stats.fps);
      if (stats.triangles > 0) globalBuffers.triangles.push(stats.triangles);
      if (stats.drawCalls > 0) globalBuffers.drawCalls.push(stats.drawCalls);

      statsStore.update({
        fps: stats.fps,
        ms: stats.ms,
        memory: stats.memory,
        gpu: stats.gpu,
        cpu: stats.cpu,
        compute: stats.compute,
        triangles: stats.triangles,
        drawCalls: stats.drawCalls,
        vsync: stats.vsync,
        isWebGPU: webGPUState.current.isWebGPU,
        gpuAccurate: stats.gpuAccurate
      });
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [options?.updateInterval, options?.trackCompute]);

  // Comprehensive cleanup effect
  useEffect(() => {
    return () => {
      // Clear all global buffers
      Object.values(globalBuffers).forEach(buffer => buffer.clear());
      
      // Reset the stats store
      statsStore.reset();
      
      // Clean up all WebGL queries
      const context = gl.getContext() as WebGL2RenderingContext;
      if (context && context.deleteQuery) {
        // Delete current query if exists
        if (gpuTimingState.current.query) {
          try {
            context.deleteQuery(gpuTimingState.current.query);
          } catch (error) {
            // Silent failure
          }
        }
        
        // Delete all tracked queries
        createdQueries.current.forEach(query => {
          try {
            context.deleteQuery(query);
          } catch (error) {
            // Silent failure
          }
        });
        
        createdQueries.current = [];
      }
      
      // Clear frame timestamps
      statsRef.current.frameTimestamps = [];
      
      // Reset vsync detector
      vsyncDetectorRef.current = new VSyncDetector(options?.vsync !== false);
    };
  }, [gl, options?.vsync]);

  return null;
}