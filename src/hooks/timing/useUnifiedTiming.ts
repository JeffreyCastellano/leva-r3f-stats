// src/hooks/timing/useUnifiedTiming.ts
import { useEffect, useRef } from 'react';
import { useFrame, addAfterEffect, useThree } from '@react-three/fiber';
import { TimingRefs } from '../utils/timing-state';
import { unifiedStore } from '../../store/unifiedStore';
import { VSyncDetector } from '../../utils/vsync';

interface SmoothingConfig {
  enabled?: boolean;
  aggressive?: boolean;
  custom?: {
    [key: string]: number;
  };
}

interface UnifiedTimingOptions {
  vsync?: boolean;
  trackCompute?: boolean;
  updateInterval?: number;
  aggressiveCount?: boolean;
  smoothing?: boolean | SmoothingConfig;
}

class GeometryAccumulator {
  triangles: number = 0;
  drawCalls: number = 0;
  
  reset(): void {
    this.triangles = 0;
    this.drawCalls = 0;
  }
  
  hasData(): boolean {
    return this.drawCalls > 0;
  }
}

class EMASmoothing {
  private value: number = 0;
  private initialized: boolean = false;
  
  constructor(private alpha: number = 0.1) {}
  
  update(newValue: number): number {
    if (!this.initialized) {
      this.value = newValue;
      this.initialized = true;
      return newValue;
    }
    
    // Exponential moving average
    this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    return this.value;
  }
  
  reset(): void {
    this.initialized = false;
    this.value = 0;
  }
}

class NoiseFilter {
  private lastValue: number = 0;
  private threshold: number;
  
  constructor(threshold: number = 0.01) {
    this.threshold = threshold;
  }
  
  filter(value: number): number {
    // Only update if change is significant
    if (Math.abs(value - this.lastValue) > this.threshold) {
      this.lastValue = value;
    }
    return this.lastValue;
  }
  
  reset(): void {
    this.lastValue = 0;
  }
}

class StatsSmoothing {
  private smoothers = new Map<string, EMASmoothing>();
  private filters = new Map<string, NoiseFilter>();
  private alphas: { [key: string]: number };
  
  constructor(config?: SmoothingConfig) {
    // Default alpha values (lower = more smoothing)
    const defaultAlphas = {
      fps: 0.05,      // Very smooth
      ms: 0.05,       // Very smooth
      memory: 0.02,   // Extra smooth (memory changes slowly)
      gpu: 0.08,      // Smooth
      cpu: 0.08,      // Smooth
      compute: 0.08,  // Smooth
      triangles: 0.15, // Less smooth (geometry can change quickly)
      drawCalls: 0.15  // Less smooth
    };
    
    // Apply aggressive smoothing if enabled
    if (config?.aggressive) {
      this.alphas = {
        fps: 0.03,
        ms: 0.03,
        memory: 0.01,
        gpu: 0.05,
        cpu: 0.05,
        compute: 0.05,
        triangles: 0.1,
        drawCalls: 0.1
      };
    } else {
      this.alphas = defaultAlphas;
    }
    
    // Apply custom alpha values if provided
    if (config?.custom) {
      Object.assign(this.alphas, config.custom);
    }
  }
  
  smooth(metric: string, value: number): number {
    if (!this.smoothers.has(metric)) {
      const alpha = this.alphas[metric] || 0.1;
      this.smoothers.set(metric, new EMASmoothing(alpha));
      
      // Add noise filter with metric-specific thresholds
      let threshold = 0.01;
      if (metric === 'memory') threshold = 0.5;
      else if (metric === 'triangles' || metric === 'drawCalls') threshold = 1;
      
      this.filters.set(metric, new NoiseFilter(threshold));
    }
    
    // First smooth, then filter noise
    const smoothed = this.smoothers.get(metric)!.update(value);
    return this.filters.get(metric)!.filter(smoothed);
  }
  
  reset(): void {
    this.smoothers.forEach(smoother => smoother.reset());
    this.filters.forEach(filter => filter.reset());
  }
}

export function useUnifiedTiming(refs: TimingRefs, options: UnifiedTimingOptions) {
  const gl = useThree(state => state.gl);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const frameTimeEMA = useRef(new EMASmoothing(0.05));
  const statsSmoothing = useRef<StatsSmoothing>(new StatsSmoothing());
  const vsyncDetector = useRef(new VSyncDetector(options.vsync !== false));

  const frameAccumulator = useRef(new GeometryAccumulator());
  const peakStats = useRef(new GeometryAccumulator());
  const originalUpdate = useRef<any>(null);
  
  // Add WebGPU-specific tracking
  const webGPUFrameStats = useRef({
    frameTriangles: 0,
    frameDrawCalls: 0,
    originalRender: null as any
  });
  
  const isWebGPU = !!(gl && (gl as any).isWebGPURenderer);
  refs.webGPUState.current.isWebGPU = isWebGPU;
  refs.stats.current.isWebGPU = isWebGPU;
  
  // Initialize metric smoothing with custom config if provided
  useEffect(() => {
    let smoothingConfig: SmoothingConfig | undefined;
    
    if (typeof options.smoothing === 'object') {
      smoothingConfig = options.smoothing;
    } else if (options.smoothing === true) {
      smoothingConfig = { enabled: true };
    } else if (options.smoothing === false) {
      smoothingConfig = { enabled: false };
    }
    
    if (smoothingConfig?.enabled !== false) {
      statsSmoothing.current = new StatsSmoothing(smoothingConfig);
    }
  }, [options.smoothing]);
  
  useFrame(() => {
    const currentTime = performance.now();
    const stats = refs.stats.current;
    
    if (lastFrameTime.current > 0) {
      const delta = currentTime - lastFrameTime.current;
      const smoothedDelta = frameTimeEMA.current.update(delta);
      stats.ms = smoothedDelta;
      stats.fps = 1000 / smoothedDelta;
    }
    
    lastFrameTime.current = currentTime;
    frameCount.current++;
    
    if (options.vsync !== false && frameCount.current % 30 === 0) {
      const vsync = vsyncDetector.current.update(stats.fps);
      if (vsync !== null) {
        stats.vsync = vsync;
      }
    }

    //@ts-ignore
    if (window.performance?.memory) {
      //@ts-ignore
      stats.memory = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
    }
  });

  useEffect(() => {
    if (!gl) return;
    
    let gpuQuery: WebGLQuery | null = null;
    let queryInProgress = false;
    let mounted = true;
    let contextLostHandler: (() => void) | null = null;
    let contextRestoredHandler: (() => void) | null = null;
    
    // Function to initialize/reinitialize
    const initialize = () => {
      // Reset frame time smoothing on reinit
      frameTimeEMA.current.reset();
      statsSmoothing.current.reset();
      
      if (!isWebGPU && (gl as any).info) {
        const info = (gl as any).info;
        
        // Store original update if not already stored
        if (!originalUpdate.current) {
          originalUpdate.current = info.update;
        }
        
        if (options.aggressiveCount) {
          const accumulator = frameAccumulator.current;
          info.update = function(count: number, mode: number, instanceCount: number) {
            originalUpdate.current.call(this, count, mode, instanceCount);
            
            accumulator.triangles += count / 3;
            accumulator.drawCalls += 1;
          };
        } else {
          const peak = peakStats.current;
          peak.reset();
          
          info.update = function(count: number, mode: number, instanceCount: number) {
            originalUpdate.current.call(this, count, mode, instanceCount);
            
            const renderInfo = (gl as any).info.render;
            if (renderInfo.triangles > peak.triangles) {
              peak.triangles = renderInfo.triangles;
            }
            if (renderInfo.calls > peak.drawCalls) {
              peak.drawCalls = renderInfo.calls;
            }
          };
        }
      }
      
      // Reinitialize WebGPU tracking
      if (isWebGPU && (gl as any).render && !webGPUFrameStats.current.originalRender) {
        webGPUFrameStats.current.originalRender = (gl as any).render.bind(gl);
        
        (gl as any).render = function(...args: any[]) {
          const info = (gl as any).info;
          const startTriangles = info?.render?.triangles || 0;
          const startCalls = info?.render?.calls || 0;
          
          // Call original render
          const result = webGPUFrameStats.current.originalRender.apply(this, args);
          
          // Calculate frame stats after render
          if (info?.render) {
            const endTriangles = info.render.triangles || 0;
            const endCalls = info.render.calls || 0;
            
            // Always update, even if 0 (empty scene)
            webGPUFrameStats.current.frameTriangles = endTriangles - startTriangles;
            webGPUFrameStats.current.frameDrawCalls = endCalls - startCalls;
          }
          
          return result;
        };
      }
    };
    
    // Set up context loss handlers for WebGL
    if (!isWebGPU) {
      const canvas = gl.domElement;
      
      contextLostHandler = () => {
        console.log('WebGL context lost, stats paused');
        queryInProgress = false;
        if (gpuQuery) {
          gpuQuery = null; // Don't try to delete, context is lost
        }
        // Reset stats to indicate no data
        refs.stats.current.gpuAccurate = false;
        refs.stats.current.gpu = 0;
      };
      
      contextRestoredHandler = () => {
        console.log('WebGL context restored, reinitializing stats');
        // Reinitialize everything
        initialize();
      };
      
      canvas.addEventListener('webglcontextlost', contextLostHandler);
      canvas.addEventListener('webglcontextrestored', contextRestoredHandler);
    }
    
    // Initial setup
    initialize();
    
    const checkGPU = () => {
      if (!mounted) return;
      
      // Skip if context is lost
      if (!isWebGPU) {
        const gl2 = gl.getContext() as WebGL2RenderingContext;
        if (!gl2 || gl2.isContextLost?.()) {
          refs.stats.current.gpuAccurate = false;
          return;
        }
      }
      
      if (isWebGPU) {
        const info = (gl as any).info;
        if (info?.render?.timestamp) {
          refs.stats.current.gpu = info.render.timestamp;
          refs.stats.current.gpuAccurate = true;
        } else {
          refs.stats.current.gpuAccurate = false;
        }
        
        if (options.trackCompute && info?.compute?.timestamp) {
          refs.stats.current.compute = info.compute.timestamp;
        }

        // Always update triangles and draw calls
        refs.stats.current.triangles = webGPUFrameStats.current.frameTriangles;
        refs.stats.current.drawCalls = webGPUFrameStats.current.frameDrawCalls;
      } else {
        // WebGL GPU timing code
        const gl2 = gl.getContext() as WebGL2RenderingContext;
        if (!gl2) return;
        
        const ext = gl2.getExtension('EXT_disjoint_timer_query_webgl2');
        
        if (ext && !queryInProgress) {
          try {
            const disjoint = gl2.getParameter(ext.GPU_DISJOINT_EXT);
            if (!disjoint) {
              gpuQuery = gl2.createQuery();
              if (gpuQuery) {
                gl2.beginQuery(ext.TIME_ELAPSED_EXT, gpuQuery);
                queryInProgress = true;
              }
            }
          } catch (e) {
            refs.stats.current.gpuAccurate = false;
          }
        }
        
        if (gpuQuery && queryInProgress) {
          try {
            const available = gl2.getQueryParameter(gpuQuery, gl2.QUERY_RESULT_AVAILABLE);
            if (available) {
              const time = gl2.getQueryParameter(gpuQuery, gl2.QUERY_RESULT) / 1000000;
              refs.stats.current.gpu = time;
              refs.stats.current.gpuAccurate = true;
              
              gl2.deleteQuery(gpuQuery);
              gpuQuery = null;
              queryInProgress = false;
            }
          } catch (e) {
            refs.stats.current.gpuAccurate = false;
            if (gpuQuery) {
              try { gl2.deleteQuery(gpuQuery); } catch {}
              gpuQuery = null;
              queryInProgress = false;
            }
          }
        }
      }
    };
    
    const endQuery = addAfterEffect(() => {
      if (queryInProgress && gpuQuery && !isWebGPU) {
        try {
          const gl2 = gl.getContext() as WebGL2RenderingContext;
          const ext = gl2?.getExtension('EXT_disjoint_timer_query_webgl2');
          if (ext) {
            gl2.endQuery(ext.TIME_ELAPSED_EXT);
          }
        } catch {}
      }
      
      if (!isWebGPU && (gl as any).info) {
        if (options.aggressiveCount) {
          const accumulator = frameAccumulator.current;
          refs.stats.current.triangles = accumulator.triangles;
          refs.stats.current.drawCalls = accumulator.drawCalls;
          accumulator.reset();
        } else {
          const peak = peakStats.current;
          refs.stats.current.triangles = peak.triangles;
          refs.stats.current.drawCalls = peak.drawCalls;
          peak.reset();
        }
      }
    });
    
    const interval = setInterval(checkGPU, 16);
    
    return () => {
      mounted = false;
      clearInterval(interval);
      endQuery();
      
      // Remove context loss handlers
      if (!isWebGPU && gl.domElement) {
        if (contextLostHandler) {
          gl.domElement.removeEventListener('webglcontextlost', contextLostHandler);
        }
        if (contextRestoredHandler) {
          gl.domElement.removeEventListener('webglcontextrestored', contextRestoredHandler);
        }
      }
      
      if (!isWebGPU && originalUpdate.current && (gl as any).info) {
        (gl as any).info.update = originalUpdate.current;
        originalUpdate.current = null;
      }
      
      // Restore WebGPU render method
      if (isWebGPU && webGPUFrameStats.current.originalRender) {
        (gl as any).render = webGPUFrameStats.current.originalRender;
        webGPUFrameStats.current.originalRender = null;
      }
      
      frameAccumulator.current.reset();
      peakStats.current.reset();
      
      if (gpuQuery) {
        try {
          const gl2 = gl.getContext() as WebGL2RenderingContext;
          gl2?.deleteQuery(gpuQuery);
        } catch {}
      }
    };
  }, [gl, isWebGPU, options.trackCompute, options.aggressiveCount]);

  useEffect(() => {
    let mounted = true;
    const updateInterval = options.updateInterval || 100;
    let lastUpdate = 0;
    
    const update = () => {
      if (!mounted) return;
      
      const now = performance.now();
      if (now - lastUpdate < updateInterval) {
        requestAnimationFrame(update);
        return;
      }
      
      lastUpdate = now;
      const stats = refs.stats.current;
      
      // Parse smoothing options
      let smoothingEnabled = false;
      if (options.smoothing === true) {
        smoothingEnabled = true;
      } else if (options.smoothing === false) {
        smoothingEnabled = false;
      } else if (typeof options.smoothing === 'object') {
        smoothingEnabled = options.smoothing.enabled !== false;
      }
      
      // Apply smoothing to all metrics
      const smoothedStats = {
        fps: stats.fps, // Already smoothed in useFrame
        ms: stats.ms,   // Already smoothed in useFrame
        memory: smoothingEnabled ? statsSmoothing.current.smooth('memory', stats.memory) : stats.memory,
        gpu: smoothingEnabled && stats.gpu > 0 ? statsSmoothing.current.smooth('gpu', stats.gpu) : stats.gpu,
        compute: smoothingEnabled && stats.compute > 0 ? statsSmoothing.current.smooth('compute', stats.compute) : stats.compute,
        triangles: smoothingEnabled ? statsSmoothing.current.smooth('triangles', stats.triangles) : stats.triangles,
        drawCalls: smoothingEnabled ? statsSmoothing.current.smooth('drawCalls', stats.drawCalls) : stats.drawCalls,
        vsync: stats.vsync,
        isWebGPU: stats.isWebGPU,
        gpuAccurate: stats.gpuAccurate
      };
      
      // Calculate CPU after GPU smoothing
      const cpuTime = smoothedStats.gpuAccurate && smoothedStats.gpu > 0 ? 
        Math.max(0, smoothedStats.ms - smoothedStats.gpu) : 0;
      
      unifiedStore.update({
        ...smoothedStats,
        cpu: smoothingEnabled && cpuTime > 0 ? statsSmoothing.current.smooth('cpu', cpuTime) : cpuTime
      });
      
      if (mounted) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
    
    return () => {
      mounted = false;
    };
  }, [refs, options.updateInterval, options.smoothing]);
}