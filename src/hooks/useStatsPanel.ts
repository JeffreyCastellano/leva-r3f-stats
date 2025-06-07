// src/hooks/useStatsPanel.ts
import { useEffect, useRef } from 'react';
import { useControls } from 'leva';
import { StatsOptions } from '../types';
import { stats } from '../plugin';
import { createInstanceBuffers, registerInstance, unifiedStore } from '../store/unifiedStore';
import { 
  TimingRefs, 
  createInitialStats, 
  createInitialWebGPUState, 
  createInitialGPUTimingState 
} from './utils/timing-state';
import { useUnifiedTiming } from './timing/useUnifiedTiming';

let globalCollectorInstances = 0;

export function useStatsPanel(options: StatsOptions = {}) {
  const instanceBuffers = useRef<ReturnType<typeof createInstanceBuffers> | null>(null);
  const cleanupStore = useRef<(() => void) | null>(null);

  const refs: TimingRefs = {
    stats: useRef(createInitialStats()),
    webGPUState: useRef(createInitialWebGPUState()),
    gpuTimingState: useRef(createInitialGPUTimingState()),
    vsyncDetector: useRef(null as any), // Now handled in useUnifiedTiming
    createdQueries: useRef<WebGLQuery[]>([])
  };

  useEffect(() => {
    instanceBuffers.current = createInstanceBuffers(options.graphHistory || 100);
    
    return () => {
      instanceBuffers.current?.destroy();
      instanceBuffers.current = null;
    };
  }, [options.graphHistory]);

  useEffect(() => {
    cleanupStore.current = registerInstance();
    
    return () => {
      cleanupStore.current?.();
    };
  }, []);

  useLevaControls(options);
  useInstanceTracking();

  // Single unified timing hook
  useUnifiedTiming(refs, {
    vsync: options.vsync,
    trackCompute: options.trackCompute,
    updateInterval: options.updateInterval,
    aggressiveCount: options.aggressiveCount
  });

  useEffect(() => {
    return () => {
      // Cleanup
      unifiedStore.reset();
    };
  }, []);

  return null;
}

function useLevaControls(options: StatsOptions) {
  const controlKey = useRef(`Performance_${Math.random().toString(36).substr(2, 9)}`);
  
  try {
    const statsControl = stats(options);
    if (!statsControl) {
      console.error('Stats control is undefined');
      return;
    }
    
    const controls: any = { [controlKey.current]: statsControl };
    useControls(controls, { order: options.order ?? -1 }, []);
  } catch (error) {
    console.error('Error in useLevaControls:', error);
  }
}

function useInstanceTracking() {
  useEffect(() => {
    globalCollectorInstances++;
    const storeInstances = unifiedStore.getInstanceCount();
    
    if (globalCollectorInstances > 1) {
      console.warn(
        `Multiple Stats instances detected: ${globalCollectorInstances} components, ${storeInstances} store instances. ` +
        'Only one instance should be active. Data may be shared between instances.'
      );
    }
    
    return () => {
      globalCollectorInstances--;
    };
  }, []);
}