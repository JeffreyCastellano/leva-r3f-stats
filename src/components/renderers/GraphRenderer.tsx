// src/components/renderers/GraphRenderer.tsx
import { StatsData, StatsOptions, StatConfig } from '../../types';
import { GraphCanvas } from '../GraphCanvas';
import { unifiedStore } from '../../store/unifiedStore';
import { styles } from '../../styles/styled';

interface GraphRendererProps {
  stats: StatsData;
  options: StatsOptions;
  configs: StatConfig[];
  thresholds: any;
}

export function GraphRenderer({ stats, options, configs }: GraphRendererProps) {
  const columns = options.columns ?? 2;
  const validColumns = Math.max(1, Math.min(columns, 8));
  const showFullLabels = options.showFullLabels ?? false;

  const graphConfigs = configs.filter(c => {
    if (c.key === 'vsync') return false;
    if (c.key === 'compute' && !options.trackCompute) return false;
    
    const value = stats[c.key];
    return value !== null && value !== undefined;
  });

  return (
    <div style={styles.graphGridContainer(validColumns)}>
      {graphConfigs.map(config => {
        const buffer = unifiedStore.buffers[config.key as keyof typeof unifiedStore.buffers];
        if (!buffer) return null;
        const value = config.key === 'gpu' && options.gpuPercentage 
        ? (stats.gpuPercent || 0)
        : (stats[config.key] as number);
        const color = options.showColors !== false && config.color 
          ? config.color(value, null as any) 
          : options.defaultColor || '#999';

        return (
          <div key={config.key} style={styles.graphItemContainer}>
            <GraphCanvas
              data={buffer}
              color={color}
              min={config.graphMin || 0}
              max={config.graphMax ? config.graphMax(null as any) : 100}
              height={options.graphHeight || 48}
              label={config.shortLabel || config.label}
              fullLabel={showFullLabels && config.labelSuffix 
                ? `${config.label} ${config.labelSuffix}` 
                : config.label}
              unit={config.unit || ''}
              currentValue={value}
              backgroundColor={options.graphBackgroundColor}
              gridColor={options.graphGridColor}
              fontSize={options.fontSize}
              showFullLabel={showFullLabels}
            />
          </div>
        );
      })}
    </div>
  );
}