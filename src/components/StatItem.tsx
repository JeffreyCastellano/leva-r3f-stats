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