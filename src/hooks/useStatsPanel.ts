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

// Global flag to track if collector is mounted
let globalCollectorMounted = false;

export function useStatsPanel(options: StatsOptions = {}) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const get = useThree(state => state.get);

  // Force unique control name to prevent caching
  const controlKey = useRef(`Performance_${Math.random().toString(36).substr(2, 9)}`);

  // Register the Leva control with unique key
  useControls({
    [controlKey.current]: stats(options)
  }, []);

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

  // For tracking render info
  const renderInfoRef = useRef({
    triangles: 0,
    drawCalls: 0
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

    // Capture current render info
    if (gl.info && gl.info.render) {
      renderInfoRef.current.triangles = gl.info.render.triangles || 0;
      renderInfoRef.current.drawCalls = gl.info.render.calls || 0;
    }

    stats.prevTime = currentTime;
  });

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

      // Use the actual render values
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
        isWebGPU: stats.isWebGPU
      });
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [options?.updateInterval, gl]);

  return null;
}