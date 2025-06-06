// components/StatItem.tsx
import React from 'react';
import { StatConfig, StatsData } from '../types';
import { globalBuffers } from '../hooks/useStatsPanel';
import {
  StatItemContainer,
  StatLabel,
  StatValue,
  MinMaxValue,
  StatItemCompact,
  StatLabelCompact,
  StatValueCompact
} from '../styles/styled';

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
        <StatItemCompact>
          <StatLabelCompact style={{ fontSize: '9px', opacity: 0.5 }}>
            {config.format(value)}
          </StatLabelCompact>
        </StatItemCompact>
      );
    }

    return (
      <StatItemCompact>
        <StatLabelCompact>{config.shortLabel}:</StatLabelCompact>
        <StatValueCompact style={{
          color: color || '#999999',
          minWidth: config.key === 'triangles' ? '40px' : '28px',
          fontFamily: 'monospace'
        }}>
          {config.format(value)}
        </StatValueCompact>
      </StatItemCompact>
    );
  }

  return (
    <StatItemContainer>
      <StatLabel>{config.label}</StatLabel>
      <StatValue style={{ color }}>
        {config.format(value)}
        {showMinMax && buffer && (
          <MinMaxValue>
            {config.format(buffer.getMin())}-{config.format(buffer.getMax())}
          </MinMaxValue>
        )}
      </StatValue>
    </StatItemContainer>
  );
}