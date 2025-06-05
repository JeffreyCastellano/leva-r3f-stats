import React, { useEffect, useState } from 'react';
import { useInputContext } from 'leva/plugin';
import { statsStore } from '../store/statsStore';
import { StatsOptions } from '../types';
import { MinMaxTracker } from '../utils/buffers';
import { CompactDisplay } from './CompactDisplay';
import { GridDisplay } from './GridDisplay';

// Global min/max trackers
const globalMinMaxTrackers: Record<string, MinMaxTracker> = {
  fps: new MinMaxTracker(),
  ms: new MinMaxTracker(),
  memory: new MinMaxTracker(),
  gpu: new MinMaxTracker(),
  compute: new MinMaxTracker(),
  triangles: new MinMaxTracker(),
  drawCalls: new MinMaxTracker()
};

export function StatsDisplay() {
  const { value } = useInputContext<StatsOptions>();
  const [stats, setStats] = useState(statsStore.get());

  // Subscribe to stats updates
  useEffect(() => {
    const unsubscribe = statsStore.subscribe(setStats);
    return unsubscribe;
  }, []);

  // Get options from value with proper default
  const options: StatsOptions = value || {};
  const compact = options.compact || false;

  if (compact) {
    return (
      <CompactDisplay
        stats={stats}
        options={options}
        minMaxTrackers={globalMinMaxTrackers}
      />
    );
  }

  return (
    <GridDisplay
      stats={stats}
      options={options}
      minMaxTrackers={globalMinMaxTrackers}
    />
  );
}

// Export the min/max trackers for use in the hook
export { globalMinMaxTrackers };