import { createPlugin } from 'leva/plugin';
import { StatsDisplay } from './components/StatsDisplay';
import { StatsOptions } from './types';

// The leva plugin system needs three type parameters: Input, Value, and Settings
export const statsPlugin = createPlugin<StatsOptions, StatsOptions, {}>({
  component: StatsDisplay,
});

export function stats(options: StatsOptions = {}): ReturnType<typeof statsPlugin> {
  return statsPlugin({
    updateInterval: 100,
    targetFramerate: null, // null means auto-detect
    compact: false,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    trackCompute: false, // Enable WebGPU compute tracking
    showTriangles: false, // Show triangle count
    vsync: true, // Enable vsync detection
    order: -1, // Appear at top by default
    ...options
  });
}