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
  }
}

// Global flag to track if collector is mounted
let globalCollectorMounted = false;

export function useStatsPanel(options: StatsOptions = {}) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const get = useThree(state => state.get);

  // Register the Leva control
  useControls({
    'Performance': stats(options)
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

    fpsBuffer: new CircularBuffer(120),
    frameTimeBuffer: new CircularBuffer(120),
    memoryEMA: new ExponentialMovingAverage(0.1),
    gpuEMA: new ExponentialMovingAverage(0.3),
    computeEMA: new ExponentialMovingAverage(0.3),

    frameTimestamps: [] as number[]
  });

  // For tracking render info per frame
  const frameInfoRef = useRef({
    triangles: 0,
    drawCalls: 0,
    lastTriangles: 0,
    lastDrawCalls: 0
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

  // Use R3F's frame loop to capture render info
  useFrame((state, delta) => {
    const stats = statsRef.current;
    const currentTime = performance.now();
    const frameInfo = frameInfoRef.current;

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

    // Capture render info BEFORE the frame renders
    if (gl.info && gl.info.render) {
      frameInfo.lastTriangles = gl.info.render.triangles || 0;
      frameInfo.lastDrawCalls = gl.info.render.calls || 0;
    }

    stats.prevTime = currentTime;
  });

  // Use addAfterEffect to capture render info AFTER the frame renders
  useEffect(() => {
    const unsubscribe = addAfterEffect(() => {
      const frameInfo = frameInfoRef.current;

      if (gl.info && gl.info.render) {
        const currentTriangles = gl.info.render.triangles || 0;
        const currentDrawCalls = gl.info.render.calls || 0;

        // Calculate the delta for this frame
        frameInfo.triangles = currentTriangles - frameInfo.lastTriangles;
        frameInfo.drawCalls = currentDrawCalls - frameInfo.lastDrawCalls;
      }

      return false; // Don't request another frame
    });

    return unsubscribe;
  }, [gl]);

  // Update stats at interval
  useEffect(() => {
    const updateInterval = options?.updateInterval || 100;

    const intervalId = setInterval(() => {
      const stats = statsRef.current;
      const currentTime = performance.now();
      const frameInfo = frameInfoRef.current;

      // Calculate actual FPS from frame count in last second
      const actualFPS = stats.frameTimestamps.length;
      stats.fpsBuffer.push(actualFPS);

      // Use smoothed FPS
      stats.fps = Math.round(stats.fpsBuffer.average());

      // Calculate smoothed frame time
      stats.ms = stats.frameTimeBuffer.averageWithoutOutliers(0.05); // Remove top/bottom 5%

      // Update memory
      if ((window.performance as ExtendedPerformance).memory) {
        const currentMemory = Math.round((window.performance as ExtendedPerformance).memory!.usedJSHeapSize / 1048576);
        stats.memory = Math.round(stats.memoryEMA.update(currentMemory));
      }

      // Simple GPU time approximation based on frame time
      const gpuTime = stats.ms * 0.7; // Assume GPU is using about 70% of frame time
      stats.gpu = stats.gpuEMA.update(gpuTime);

      // Use the frame info we captured
      stats.triangles = frameInfo.triangles;
      stats.drawCalls = frameInfo.drawCalls;

      // Update min/max trackers
      if (stats.triangles > 0) {
        globalMinMaxTrackers.triangles.update(stats.triangles);
      }
      if (stats.drawCalls > 0) {
        globalMinMaxTrackers.drawCalls.update(stats.drawCalls);
      }

      // Update min/max trackers
      globalMinMaxTrackers.fps.update(stats.fps);
      globalMinMaxTrackers.ms.update(stats.ms);
      globalMinMaxTrackers.memory.update(stats.memory);
      globalMinMaxTrackers.gpu.update(stats.gpu);

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