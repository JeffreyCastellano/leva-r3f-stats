import { StatsData, StatsOptions } from '../types';
import { createStatConfigs } from '../utils/statConfigs';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import { StatItem } from './StatItem';
import { GraphCanvas } from './GraphCanvas';
import { globalBuffers } from '../hooks/useStatsPanel';
import {
  StatsContainer,
  StatsCompactWrapper,
  GraphGridContainer,
  GraphItemContainer,
  StatItemCompact,
  StatLabelCompact,
  StatValueCompact
} from '../styles/styled';
import { formatTriangles } from '../utils/formatters';

interface ModularDisplayProps {
  stats: StatsData;
  options: StatsOptions;
}

export function ModularDisplay({ stats, options }: ModularDisplayProps) {
  const targetFPS = options.targetFramerate || getTargetFrameRate(stats.vsync);
  const thresholds = calculateThresholds(targetFPS);
  const configs = createStatConfigs(options, thresholds);

  const displayConfigs = options.compact 
    ? configs.filter(c => c.showInCompact === true)
    : configs;

  const visibleConfigs = displayConfigs.filter(config => {
    if (config.key === 'compute' && (!stats.isWebGPU || stats.compute === 0)) {
      return false;
    }
    if (config.key === 'vsync' && !stats.vsync) {
      return false;
    }
    return true;
  });

  let columns: number;
  if (options.graphHeight && options.graphHeight > 0) {
    columns = options.columnsGraph ?? options.columns ?? 2;
  } else if (options.compact) {
    columns = options.columnsCompact ?? options.columns ?? 4;
  } else {
    columns = options.columns ?? 2;
  }

  columns = Math.max(1, Math.min(columns, 8));

 
  const fontSize = options.fontSize || (options.compact ? 11 : 12);

  // Graphs
  if (options.graphHeight && options.graphHeight > 0) {
    const graphConfigs = visibleConfigs.filter(c => 
      c.key !== 'vsync' && 
      (stats[c.key] as number) > 0
    );

    return (
      <GraphGridContainer columns={columns as any}>
        {graphConfigs.map(config => {
          const buffer = globalBuffers[config.key as keyof typeof globalBuffers];
          if (!buffer) return null;

          const value = stats[config.key] as number;
          const color = options.showColors !== false && config.color 
            ? config.color(value, thresholds) 
            : options.defaultColor || '#999';

          return (
            <GraphItemContainer key={config.key}>
              <GraphCanvas
                data={buffer}
                color={color}
                min={config.graphMin || 0}
                max={config.graphMax ? config.graphMax(thresholds) : 100}
                height={options.graphHeight || 48}
                label={config.shortLabel || config.label}
                unit={config.unit || ''}
                currentValue={value}
              />
            </GraphItemContainer>
          );
        })}
      </GraphGridContainer>
    );
  }

  if (options.compact) {
    return (
      <StatsCompactWrapper columns={columns as any} fontSize={fontSize as any}>
        {visibleConfigs.map(config => {
          const value = stats[config.key] as number;
          const color = options.showColors !== false && config.color 
            ? config.color(value, thresholds) 
            : options.defaultColor || '#999999';

          let formattedValue = config.format(value);
          if (config.key === 'triangles') {
            formattedValue = formatTriangles(value);
          }

          return (
            <StatItemCompact key={config.key}>
              <StatLabelCompact>{config.shortLabel}:</StatLabelCompact>
              <StatValueCompact style={{ color }}>
                {formattedValue}
              </StatValueCompact>
            </StatItemCompact>
          );
        })}
      </StatsCompactWrapper>
    );
  }

  return (
    <StatsContainer columns={columns as any} fontSize={fontSize as any}>
      {visibleConfigs.map(config => (
        <StatItem
          key={config.key}
          config={config}
          stats={stats}
          showMinMax={options.showMinMax !== false}
          showColors={options.showColors !== false}
          defaultColor={options.defaultColor}
          compact={false}
        />
      ))}
    </StatsContainer>
  );
}