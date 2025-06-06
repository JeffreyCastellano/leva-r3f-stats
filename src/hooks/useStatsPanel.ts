import { useEffect, useRef } from 'react';
import { useThree, useFrame, addAfterEffect } from '@react-three/fiber';
import { useControls } from 'leva';
import { StatsOptions, GPUTimingState } from '../types';
import { stats } from '../plugin';
import { statsStore } from '../store/statsStore';
import { VSyncDetector } from '../utils/vsync';
import { RingBuffer } from '../utils/RingBuffer';

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

// Global buffers for graph display
export const globalBuffers = {
  fps: new RingBuffer(100),
  ms: new RingBuffer(100),
  memory: new RingBuffer(100),
  gpu: new RingBuffer(100),
  cpu: new RingBuffer(100),
  compute: new RingBuffer(100),
  triangles: new RingBuffer(100),
  drawCalls: new RingBuffer(100)
};

interface WebGPUState {
  isWebGPU: boolean;
  hasTimestampQuery: boolean;
}

let globalCollectorInstances = 0;

export function useStatsPanel(options: StatsOptions = {}) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const get = useThree(state => state.get);

  const controlKey = useRef(`Performance_${Math.random().toString(36).substr(2, 9)}`);
  
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

  // FIX: Check for WebGPU first, before trying WebGL extensions
  useEffect(() => {
    if (!gl) return;

    // Check if it's a WebGPU renderer first
    const isWebGPU = !!(gl && (gl as any).isWebGPURenderer);
    
    if (isWebGPU) {
      // It's WebGPU, don't try to get WebGL extensions
      webGPUState.current.isWebGPU = true;
      statsRef.current.isWebGPU = true;
      
      // Enable WebGPU timestamp tracking
      if ((gl as any).backend) {
        (gl as any).backend.trackTimestamp = true;
      }
      
      console.warn('WebGPU renderer detected, skipping WebGL extension initialization');
      return;
    }

    // Only try WebGL extensions if it's not WebGPU
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
      console.warn('GPU timing init failed:', error);
    }
  }, [gl]);

// WebGPU timestamp
useEffect(() => {
  if (!webGPUState.current.isWebGPU) {
    return;
  }

  const renderer = get().gl;
  let intervalId: NodeJS.Timeout;
  let frameCleanupId: any;

  const frameCleanup = addAfterEffect(() => {
    if ((renderer as any).backend?.trackTimestamp) {
      Promise.resolve().then(async () => {
        try {
          await (renderer as any).resolveTimestampsAsync();
        } catch (e) {
          console.warn('WebGPU timestamp failure:', e);
        }
      });
    }
  });

  const resolveTimestamps = async () => {
    try {
      // Check if we have the info object with timestamps first
      if ((renderer as any).info?.render?.timestamp !== undefined) {
        const gpuTime = (renderer as any).info.render.timestamp;
        if (typeof gpuTime === 'number' && gpuTime > 0) {
          statsRef.current.gpu = gpuTime;
          statsRef.current.gpuAccurate = true;
          globalBuffers.gpu.push(gpuTime);
        }
        
        if (options?.trackCompute && (renderer as any).info?.compute?.timestamp !== undefined) {
          const computeTime = (renderer as any).info.compute.timestamp;
          if (typeof computeTime === 'number' && computeTime > 0) {
            statsRef.current.compute = computeTime;
            globalBuffers.compute.push(computeTime);
          }
        }
      }
    } catch (error) {
      console.warn('WebGPU timestamp failure:', error);
    }
  };

  intervalId = setInterval(resolveTimestamps, 250);
  frameCleanupId = frameCleanup;

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (frameCleanupId) {
      frameCleanupId();
    }
  };
}, [get, options?.trackCompute]);

 
  useFrame((state, delta) => {
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
    if (!gl.info) return;
    
    const unsubscribe = addAfterEffect(() => {
      if (gl.info && gl.info.render) {
        statsRef.current.triangles = gl.info.render.triangles || 0;
        statsRef.current.drawCalls = gl.info.render.calls || 0;
      }
    });
    
    return () => unsubscribe();
  }, [gl]);

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
            gpuTiming.query = gl2.createQuery();
            if (gpuTiming.query) {
              gl2.beginQuery(gpuTiming.ext.TIME_ELAPSED_EXT, gpuTiming.query);
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
            
            gl2.deleteQuery(gpuTiming.query);
            gpuTiming.query = null;
            gpuTiming.queryInProgress = false;
          }
        } catch (error) {
          console.debug('GPU query check failed:', error);
          if (gpuTiming.query) {
            try {
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
  }, [gl, webGPUState.current.isWebGPU]);

  // WebGPU timestamp
  useEffect(() => {
    if (!webGPUState.current.isWebGPU || !webGPUState.current.hasTimestampQuery) {
      return;
    }

    const renderer = get().gl;
    let intervalId: NodeJS.Timeout;

    const resolveTimestamps = async () => {
      try {
        if (typeof (renderer as any).resolveTimestampsAsync === 'function') {
          const renderTimestamp = await (renderer as any).resolveTimestampsAsync(0);
          
          if (renderTimestamp !== undefined && renderTimestamp !== null) {
            const gpuTime = Number(renderTimestamp);
            if (!isNaN(gpuTime) && gpuTime > 0) {
              statsRef.current.gpu = gpuTime;
              statsRef.current.gpuAccurate = true;
              globalBuffers.gpu.push(gpuTime);
            }
          }
          
          if (options?.trackCompute) {
            const computeTimestamp = await (renderer as any).resolveTimestampsAsync(1);
            
            if (computeTimestamp !== undefined && computeTimestamp !== null) {
              const computeTime = Number(computeTimestamp);
              if (!isNaN(computeTime) && computeTime > 0) {
                statsRef.current.compute = computeTime;
                globalBuffers.compute.push(computeTime);
              }
            }
          }
        } 
        else if ((renderer as any).info?.render?.timestamp !== undefined) {
          const gpuTime = (renderer as any).info.render.timestamp;
          if (typeof gpuTime === 'number' && gpuTime > 0) {
            statsRef.current.gpu = gpuTime;
            statsRef.current.gpuAccurate = true;
            globalBuffers.gpu.push(gpuTime);
          }
          
          if (options?.trackCompute && (renderer as any).info?.compute?.timestamp !== undefined) {
            const computeTime = (renderer as any).info.compute.timestamp;
            if (typeof computeTime === 'number' && computeTime > 0) {
              statsRef.current.compute = computeTime;
              globalBuffers.compute.push(computeTime);
            }
          }
        }
      } catch (error) {
      }
    };

    intervalId = setInterval(resolveTimestamps, 250);

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

  useEffect(() => {
    return () => {
      Object.values(globalBuffers).forEach(buffer => buffer.clear());
      statsStore.reset();
      
      if (gpuTimingState.current.query) {
        const context = gl.getContext() as WebGL2RenderingContext;
        if (context && context.deleteQuery) {
          try {
            context.deleteQuery(gpuTimingState.current.query);
          } catch (error) {
          }
        }
      }
    };
  }, [gl]);

  return null;
}