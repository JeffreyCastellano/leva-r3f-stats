import { StatConfig, StatsData } from '../types';
import { globalBuffers } from '../store/globalBuffers';
import { styles } from '../styles/styled';

interface StatItemProps {
  config: StatConfig;
  stats: StatsData;
  showMinMax: boolean;
  showColors: boolean;
  defaultColor?: string;
  compact?: boolean;
}

export function StatItem({ config, stats, showMinMax, showColors, defaultColor, compact }: StatItemProps) {
  const value = stats[config.key] as number;
  const buffer = globalBuffers[config.key as keyof typeof globalBuffers];
  
  if (value === null || value === undefined) return null;

  const color = showColors && config.color ? config.color(value, null as any) : defaultColor;

  if (compact) {
    if (config.key === 'vsync' && value) {
      return (
        <div style={styles.statItemCompact}>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>
            {config.format(value)}
          </span>
        </div>
      );
    }

    return (
      <div style={styles.statItemCompact}>
        <span style={styles.statLabelCompact}>{config.shortLabel}:</span>
        <span style={{
          ...styles.statValueCompact,
          color: color || '#999999',
          minWidth: config.key === 'triangles' ? '40px' : '28px',
          fontFamily: 'monospace'
        }}>
          {config.format(value)}
        </span>
      </div>
    );
  }

  return (
    <div style={styles.statItem}>
      <div style={styles.statLabel}>{config.label}</div>
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
}