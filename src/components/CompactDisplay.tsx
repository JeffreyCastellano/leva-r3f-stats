import React from 'react';
import { StatsData, StatsOptions } from '../types';
import { MinMaxTracker } from '../utils/buffers';
import { formatFPS, formatMS, formatMemory, formatGPU, formatTo3Digits, formatTriangles } from '../utils/formatters';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import {
  StatsCompactWrapper,
  StatsContainerCompact,
  StatItemCompact,
  StatLabelCompact,
  StatValueCompact
} from '../styles/styled';

interface CompactDisplayProps {
  stats: StatsData;
  options: StatsOptions;
  minMaxTrackers: Record<string, MinMaxTracker>;
}

export function CompactDisplay({ stats, options, minMaxTrackers }: CompactDisplayProps) {
  const showTriangles = options.showTriangles || false;
  const showVsync = options.vsync !== false;

  // Determine target framerate
  let targetFPS: number;
  if (options.targetFramerate && options.targetFramerate > 0) {
    targetFPS = options.targetFramerate;
  } else {
    targetFPS = getTargetFrameRate();
  }

  const thresholds = calculateThresholds(targetFPS);

  // Helper functions to get colors
  const getFPSColor = (fps: number) => {
    if (fps < thresholds.fpsCritical) return '#ff6b6b';
    if (fps < thresholds.fpsWarning) return '#ffd93d';
    return '#51cf66';
  };

  const getMSColor = (ms: number) => {
    if (ms > thresholds.msCritical) return '#ff6b6b';
    if (ms > thresholds.msWarning) return '#ffd93d';
    return '#51cf66';
  };

  const { fps, ms, memory, gpu, vsync, triangles, drawCalls } = stats;

  return (
    <StatsCompactWrapper>
      <StatsContainerCompact>
        <StatItemCompact>
          <StatLabelCompact>FPS:</StatLabelCompact>
          <StatValueCompact style={{
            color: options.showColors !== false ? getFPSColor(fps) : options.defaultColor || '#999999',
            minWidth: '28px',
            fontFamily: 'monospace'
          }}>
            {formatFPS(fps)}
          </StatValueCompact>
        </StatItemCompact>

        <StatItemCompact>
          <StatLabelCompact>MS:</StatLabelCompact>
          <StatValueCompact style={{
            color: options.showColors !== false ? getMSColor(ms) : options.defaultColor || '#999999',
            minWidth: '28px',
            fontFamily: 'monospace'
          }}>
            {formatMS(ms)}
          </StatValueCompact>
        </StatItemCompact>

        <StatItemCompact>
          <StatLabelCompact>MEM:</StatLabelCompact>
          <StatValueCompact style={{
            color: options.defaultColor || '#999999',
            minWidth: '28px',
            fontFamily: 'monospace'
          }}>
            {formatMemory(memory)}
          </StatValueCompact>
        </StatItemCompact>

        <StatItemCompact>
          <StatLabelCompact>GPU:</StatLabelCompact>
          <StatValueCompact style={{
            color: options.showColors !== false ? getMSColor(Number(gpu)) : options.defaultColor || '#999999',
            minWidth: '28px',
            fontFamily: 'monospace'
          }}>
            {formatGPU(gpu)}
          </StatValueCompact>
        </StatItemCompact>

        {showVsync && vsync && (
          <StatItemCompact>
            <StatLabelCompact style={{ fontSize: '9px', opacity: 0.5 }}>
              {vsync}Hz
            </StatLabelCompact>
          </StatItemCompact>
        )}
      </StatsContainerCompact>

      {showTriangles && (
        <StatsContainerCompact>
          <StatItemCompact>
            <StatLabelCompact>TRI:</StatLabelCompact>
            <StatValueCompact style={{
              color: options.defaultColor || '#999999',
              minWidth: '40px',
              fontFamily: 'monospace'
            }}>
              {formatTriangles(triangles)}
            </StatValueCompact>
          </StatItemCompact>

          <StatItemCompact>
            <StatLabelCompact>DRW:</StatLabelCompact>
            <StatValueCompact style={{
              color: options.defaultColor || '#999999',
              minWidth: '28px',
              fontFamily: 'monospace'
            }}>
              {formatTo3Digits(drawCalls)}
            </StatValueCompact>
          </StatItemCompact>
        </StatsContainerCompact>
      )}
    </StatsCompactWrapper>
  );
}