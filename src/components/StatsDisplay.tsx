// components/StatsDisplay.tsx
import React, { useEffect, useState } from 'react';
import { useInputContext } from 'leva/plugin';
import { statsStore } from '../store/statsStore';
import { StatsOptions } from '../types';
import { ModularDisplay } from './ModularDisplay';

export function StatsDisplay() {
  const { value } = useInputContext<StatsOptions>();
  const [stats, setStats] = useState(statsStore.get());

  useEffect(() => {
    const unsubscribe = statsStore.subscribe(setStats);
    return unsubscribe;
  }, []);

  const options: StatsOptions = {
    updateInterval: 100,
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
    },
    ...(value as StatsOptions)
  };

  return <ModularDisplay stats={stats} options={options} />;
}