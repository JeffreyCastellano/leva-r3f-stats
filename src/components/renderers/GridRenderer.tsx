import { StatsData, StatsOptions, StatConfig } from '../../types';
import { unifiedStore } from '../../store/unifiedStore';
import { styles } from '../../styles/styled';

interface GridRendererProps {
  stats: StatsData;
  options: StatsOptions;
  configs: StatConfig[];
}

export function GridRenderer({ stats, options, configs }: GridRendererProps) {
  const columns = options.columns ?? 2;
  const validColumns = Math.max(1, Math.min(columns, 8));
  const fontSize = options.fontSize || 12;
  const showMinMax = options.showMinMax !== false;

  return (
    <div style={styles.statsContainer(validColumns, fontSize)}>
      {configs.map(config => {
        const value = stats[config.key] as number;
        const buffer = unifiedStore.buffers[config.key as keyof typeof unifiedStore.buffers];
        
        if (value === null || value === undefined) return null;

        const color = options.showColors !== false && config.color 
          ? config.color(value, null as any) 
          : options.defaultColor;

        return (
          <div key={config.key} style={styles.statItem}>
            <div style={styles.statLabel}>
              {config.label}
              {config.labelSuffix && (
                <span style={styles.labelSuffix}>{config.labelSuffix}</span>
              )}
            </div>
            <div style={{ ...styles.statValue, color }}>
              {config.format(value)}
              {showMinMax && buffer && (
                <span style={styles.minMaxValue}>
                  {config.format(buffer.getMin())}-{config.format(buffer.getMax())}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}