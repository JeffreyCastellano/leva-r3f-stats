// ModularDisplay.tsx - Pass budgets to threshold calculation
import { useMemo } from 'react';
import { StatsData, StatsOptions } from '../types';
import { createStatConfigs, getVisibleConfigs } from '../utils/statConfigs';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import { GraphRenderer } from './renderers/GraphRenderer';
import { CompactRenderer } from './renderers/CompactRenderer';
import { GridRenderer } from './renderers/GridRenderer';

interface ModularDisplayProps {
  stats: StatsData;
  options: StatsOptions;
}

export function ModularDisplay({ stats, options }: ModularDisplayProps) {
  // Memoize target FPS calculation
  const targetFPS = useMemo(() => {
    return options.targetFramerate || getTargetFrameRate(stats.vsync);
  }, [options.targetFramerate, stats.vsync]);

  // Memoize thresholds calculation with budgets
  const thresholds = useMemo(() => {
    return calculateThresholds(
      targetFPS, 
      options.trianglesBudget,
      options.drawCallsBudget
    );
  }, [targetFPS, options.trianglesBudget, options.drawCallsBudget]);

  // Memoize stat configs creation
  const allConfigs = useMemo(() => {
    return createStatConfigs(options, thresholds);
  }, [options, thresholds]);

  // Rest of the component remains the same...
  // Memoize graph options to prevent recreation
  const graphOptions = useMemo(() => {
    if (!options.graphHeight || options.graphHeight <= 0) {
      return null;
    }

    return options.compact ? {
      ...options,
      fontSize: options.fontSize || 9,
      graphHeight: options.graphHeight || 40,
      columns: options.columns || 3
    } : options;
  }, [
    options.graphHeight,
    options.compact,
    options.fontSize,
    options.columns,
    options.graphBackgroundColor,
    options.graphGridColor,
    options.showColors,
    options.defaultColor,
    options.trianglesBudget,
    options.drawCallsBudget
  ]);

  // Graph mode
  if (graphOptions) {
    // Get visible configs for graph mode - always use full configs
    const graphConfigs = useMemo(() => {
      return getVisibleConfigs(allConfigs, stats, false);
    }, [allConfigs, stats]);
    
    return (
      <GraphRenderer 
        stats={stats} 
        options={graphOptions} 
        configs={graphConfigs}
        thresholds={thresholds}
      />
    );
  }

  // Text mode - get visible configs based on compact mode
  const visibleConfigs = useMemo(() => {
    return getVisibleConfigs(allConfigs, stats, options.compact);
  }, [allConfigs, stats, options.compact]);
  
  if (options.compact) {
    return (
      <CompactRenderer 
        stats={stats} 
        options={options} 
        configs={visibleConfigs}
      />
    );
  }

  return (
    <GridRenderer 
      stats={stats} 
      options={options} 
      configs={visibleConfigs}
    />
  );
}