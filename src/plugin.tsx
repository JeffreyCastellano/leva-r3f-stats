import { createPlugin } from 'leva/plugin';
import { StatsDisplay } from './components/StatsDisplay';
import { StatsOptions } from './types';

export const statsPlugin = createPlugin<StatsOptions, StatsOptions, {}>({
  component: StatsDisplay,
});

export function stats(options: StatsOptions = {}): ReturnType<typeof statsPlugin> {
  return statsPlugin({
    updateInterval: 100,
    targetFramerate: null,
    compact: false,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    trackCompute: false,
    vsync: true,
    order: -1,
    graphHeight: 0,
    graphHistory: 100,
    columns: undefined,
    columnsCompact: undefined, // Defaults 4
    columnsGraph: undefined, // Defaults 2
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
    ...options
  });
}