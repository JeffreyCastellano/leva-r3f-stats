import { useEffect, useState, useMemo, useRef } from 'react';
import { useInputContext } from 'leva/plugin';
import { unifiedStore } from '../store/unifiedStore';
import { StatsOptions, StatsData } from '../types';
import { ModularDisplay } from './ModularDisplay';

export function StatsDisplay() {
  const context = useInputContext<{ value: StatsOptions }>();
  const [stats, setStats] = useState(unifiedStore.get());
  const throttleTimerRef = useRef<number | null>(null);
  const latestStatsRef = useRef<StatsData>(stats);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const defaultOptions: StatsOptions = useMemo(() => ({
    updateInterval: 50,
    smoothing: true,
    targetFramerate: null,
    compact: false,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    trackCompute: false,
    vsync: true,
    graphHeight: 0,
    graphHistory: 100,
    fontSize: undefined,
    stats: {
      fps: { show: true, order: 0 },
      ms: { show: true, order: 1 },
      memory: { show: true, order: 2 },
      gpu: { show: true, order: 3 },
      cpu: { show: true, order: 4 },
      compute: { show: true, order: 5 },
      triangles: { show: true, order: 6 },
      drawCalls: { show: true, order: 7 },
      vsync: { show: true, order: 8 }
    }
  }), []);

  const options = useMemo(() => {
    if (context && context.value) {
      if (typeof context.value === 'object' && 'value' in context.value) {
        return { ...defaultOptions, ...(context.value.value as StatsOptions) };
      }
      return { ...defaultOptions, ...(context.value as StatsOptions) };
    }
    
    return defaultOptions;
  }, [context, defaultOptions]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const connect = () => {
      const throttledSetStats = (newStats: StatsData) => {
        latestStatsRef.current = newStats;
        lastUpdateRef.current = Date.now();
        
        if (!throttleTimerRef.current) {
          throttleTimerRef.current = setTimeout(() => {
            setStats(latestStatsRef.current);
            throttleTimerRef.current = null;
          }, 16) as unknown as number;
        }
      };
      
      unsubscribe = unifiedStore.subscribe(throttledSetStats);
    };
    
    // Initial connection
    connect();
    
    // Check for stale data and reconnect if needed
    const checkConnection = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      if (timeSinceLastUpdate > 1000) { // No update for 1 second
        console.log('Stats appear stale, attempting reconnection...');
        if (unsubscribe) {
          unsubscribe();
        }
        connect();
      }
    }, 1000);
    
    return () => {
      clearInterval(checkConnection);
      if (unsubscribe) {
        unsubscribe();
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  return <ModularDisplay stats={stats} options={options} />;
}

export default StatsDisplay;