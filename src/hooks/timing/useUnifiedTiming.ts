import { useEffect, useRef } from 'react';
import { useFrame, addAfterEffect, useThree } from '@react-three/fiber';
import { TimingRefs } from '../utils/timing-state';
import { unifiedStore } from '../../store/unifiedStore';
import { VSyncDetector } from '../../utils/vsync';

interface SmoothingConfig {
  enabled?: boolean;
  timing?: { maxSamples?: number; outlierThreshold?: number };
  geometry?: { maxSamples?: number; outlierThreshold?: number };
  memory?: { maxSamples?: number; outlierThreshold?: number };
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

class FrameTimeSmoothing {
  private samples: number[] = [];
  private readonly maxSamples: number;
  private readonly outlierThreshold: number;
  
  constructor(config = { maxSamples: 10, outlierThreshold: 2.5 }) {
    this.maxSamples = config.maxSamples;
    this.outlierThreshold = config.outlierThreshold;
  }
  
  add(frameTime: number): number {
    // Add to samples
    this.samples.push(frameTime);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // Not enough samples yet
    if (this.samples.length < 3) {
      return frameTime;
    }
    
    // Calculate median and standard deviation
    const sorted = [...this.samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate MAD (Median Absolute Deviation) for robust outlier detection
    const deviations = sorted.map(x => Math.abs(x - median));
    const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)];
    const threshold = median + (mad * this.outlierThreshold);
    
    // If current frame is an outlier, use median instead
    if (frameTime > threshold && this.samples.length >= 5) {
      return median;
    }
    
    // Use weighted average of recent samples, giving more weight to non-outliers
    const weights = this.samples.map(sample => 
      sample > threshold ? 0.1 : 1.0
    );
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const weightedAvg = this.samples.reduce((sum, sample, i) => 
      sum + (sample * weights[i]), 0
    ) / weightSum;
    
    return weightedAvg;
  }
  
  reset(): void {
    this.samples = [];
  }
}

class MetricSmoothing {
  private smoothers: Map<string, FrameTimeSmoothing> = new Map();
  private configs: {
    timing: { maxSamples: number; outlierThreshold: number };
    geometry: { maxSamples: number; outlierThreshold: number };
    memory: { maxSamples: number; outlierThreshold: number };
  };
  
  constructor(customConfig?: SmoothingConfig) {
    this.configs = {
      timing: { 
        maxSamples: 10, 
        outlierThreshold: 2.5,
        ...(customConfig?.timing || {})
      },
      geometry: { 
        maxSamples: 5, 
        outlierThreshold: 3.0,
        ...(customConfig?.geometry || {})
      },
      memory: { 
        maxSamples: 20, 
        outlierThreshold: 2.0,
        ...(customConfig?.memory || {})
      }
    };
  }
  
  getSmoothed(metric: string, value: number): number {
    if (!this.smoothers.has(metric)) {
      const config = this.getConfig(metric);
      this.smoothers.set(metric, new FrameTimeSmoothing(config));
    }
    
    return this.smoothers.get(metric)!.add(value);
  }
  
  private getConfig(metric: string) {
    if (['ms', 'gpu', 'cpu', 'compute'].includes(metric)) {
      return this.configs.timing;
    }
    if (['triangles', 'drawCalls'].includes(metric)) {
      return this.configs.geometry;
    }
    if (metric === 'memory') {
      return this.configs.memory;
    }
    return this.configs.timing; // default
  }
  
  reset(): void {
    this.smoothers.clear();
  }
}

export function useUnifiedTiming(refs: TimingRefs, options: UnifiedTimingOptions) {
  const gl = useThree(state => state.gl);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const frameTimeSmoothing = useRef(new FrameTimeSmoothing());
  const metricSmoothing = useRef<MetricSmoothing>(new MetricSmoothing());
  const vsyncDetector = useRef(new VSyncDetector(options.vsync !== false));
  const lastWebGPUStats = useRef({ drawCalls: 0, triangles: 0 });

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
    if (typeof options.smoothing === 'object' && options.smoothing.enabled !== false) {
      metricSmoothing.current = new MetricSmoothing(options.smoothing);
    }
  }, [options.smoothing]);
  
  useFrame(() => {
    const currentTime = performance.now();
    const stats = refs.stats.current;
    
    if (lastFrameTime.current > 0) {
      const delta = currentTime - lastFrameTime.current;
      const smoothedDelta = frameTimeSmoothing.current.add(delta);
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
      frameTimeSmoothing.current.reset();
      metricSmoothing.current.reset();
      
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

        // CHANGED: Always update triangles and draw calls (removed the if > 0 check)
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
          // CHANGED: Always update, removed hasData() check
          refs.stats.current.triangles = accumulator.triangles;
          refs.stats.current.drawCalls = accumulator.drawCalls;
          accumulator.reset();
        } else {
          const peak = peakStats.current;
          // CHANGED: Always update, removed > 0 check
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
      
      // NEW: Restore WebGPU render method
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
      } else if (typeof options.smoothing === 'object') {
        smoothingEnabled = options.smoothing.enabled !== false;
      }
      
      const smoothedStats = {
        fps: stats.fps, // Already smoothed in useFrame
        ms: stats.ms,   // Already smoothed in useFrame
        memory: smoothingEnabled ? metricSmoothing.current.getSmoothed('memory', stats.memory) : stats.memory,
        gpu: smoothingEnabled ? metricSmoothing.current.getSmoothed('gpu', stats.gpu) : stats.gpu,
        compute: smoothingEnabled ? metricSmoothing.current.getSmoothed('compute', stats.compute) : stats.compute,
        triangles: smoothingEnabled ? metricSmoothing.current.getSmoothed('triangles', stats.triangles) : stats.triangles,
        drawCalls: smoothingEnabled ? metricSmoothing.current.getSmoothed('drawCalls', stats.drawCalls) : stats.drawCalls,
        vsync: stats.vsync,
        isWebGPU: stats.isWebGPU,
        gpuAccurate: stats.gpuAccurate
      };
      
      // Calculate CPU after GPU smoothing
      const cpuTime = smoothedStats.gpuAccurate ? 
        Math.max(0, smoothedStats.ms - smoothedStats.gpu) : 0;
      
      unifiedStore.update({
        ...smoothedStats,
        cpu: smoothingEnabled ? metricSmoothing.current.getSmoothed('cpu', cpuTime) : cpuTime
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