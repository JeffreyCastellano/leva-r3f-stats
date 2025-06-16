import { StatsData, StatsOptions, StatConfig } from '../../types';
import { styles } from '../../styles/styled';

interface CompactRendererProps {
  stats: StatsData;
  options: StatsOptions;
  configs: StatConfig[];
}

export function CompactRenderer({ stats, options, configs }: CompactRendererProps) {
  const columns = options.columnsCompact ?? options.columns ?? 4;
  const validColumns = Math.max(1, Math.min(columns, 8));
  const fontSize = options.fontSize || 11;

  return (
    <div style={styles.statsCompactWrapper(validColumns, fontSize)}>
      {configs.map(config => {
        const value = config.key === 'gpu' && options.gpuPercentage 
        ? (stats.gpuPercent || 0)
        : (stats[config.key] as number);
        if (value === undefined || value === null || Number.isNaN(value)) {
          return null;
        }
        
        const color = options.showColors !== false && config.color 
          ? config.color(value, null as any) 
          : options.defaultColor || '#999999';

        const formattedValue = config.format(value);

        if (config.key === 'vsync' && value) {
          return (
            <div key={config.key} style={styles.statItemCompact}>
              <span style={{ fontSize: '9px', opacity: 0.5 }}>
                {value}Hz
              </span>
            </div>
          );
        }

        return (
          <div key={config.key} style={styles.statItemCompact}>
            <span style={styles.statLabelCompact}>{config.shortLabel}:</span>
            <span style={{ 
              ...styles.statValueCompact, 
              color,
              minWidth: '28px',
              fontFamily: 'monospace',
            }}>
              {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}