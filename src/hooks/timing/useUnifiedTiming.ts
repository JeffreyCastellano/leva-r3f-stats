import { useEffect, useRef } from 'react';
import { useFrame, addAfterEffect, useThree } from '@react-three/fiber';
import { TimingRefs } from '../utils/timing-state';
import { unifiedStore } from '../../store/unifiedStore';
import { VSyncDetector } from '../../utils/vsync';

interface UnifiedTimingOptions {
  vsync?: boolean;
  trackCompute?: boolean;
  updateInterval?: number;
  aggressiveCount?: boolean;
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

export function useUnifiedTiming(refs: TimingRefs, options: UnifiedTimingOptions) {
  const gl = useThree(state => state.gl);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const avgFrameTime = useRef(16.67);
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
  
  useFrame(() => {
    const currentTime = performance.now();
    const stats = refs.stats.current;
    
    if (lastFrameTime.current > 0) {
      const delta = currentTime - lastFrameTime.current;
      avgFrameTime.current = avgFrameTime.current * 0.9 + delta * 0.1;
      stats.ms = avgFrameTime.current;
      stats.fps = 1000 / avgFrameTime.current;
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
    
    if (!isWebGPU && (gl as any).info) {
      const info = (gl as any).info;
      
      if (options.aggressiveCount) {
        originalUpdate.current = info.update;
        
        const accumulator = frameAccumulator.current;
        info.update = function(count: number, mode: number, instanceCount: number) {
          originalUpdate.current.call(this, count, mode, instanceCount);
          
          accumulator.triangles += count / 3;
          accumulator.drawCalls += 1;
        };
      } else {
        const peak = peakStats.current;
        peak.reset();
        
        originalUpdate.current = info.update;
        
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
    
    // NEW: WebGPU frame-based tracking
    if (isWebGPU && (gl as any).render) {
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
    
    const checkGPU = () => {
      if (!mounted) return;
      
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
      
      // CHANGED: Calculate CPU time only when GPU timing is accurate
      const cpuTime = stats.gpuAccurate ? Math.max(0, stats.ms - stats.gpu) : 0;
      
      unifiedStore.update({
        fps: stats.fps,
        ms: stats.ms,
        memory: stats.memory,
        gpu: stats.gpu,
        cpu: cpuTime,  // Only accurate when GPU timing is available
        compute: stats.compute,
        triangles: stats.triangles,
        drawCalls: stats.drawCalls,
        vsync: stats.vsync,
        isWebGPU: stats.isWebGPU,
        gpuAccurate: stats.gpuAccurate
      });
      
      if (mounted) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
    
    return () => {
      mounted = false;
    };
  }, [refs, options.updateInterval]);
}