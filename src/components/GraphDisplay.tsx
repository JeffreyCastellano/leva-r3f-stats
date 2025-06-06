import React from 'react';
import { styled } from '@stitches/react';
import { StatsData, StatsOptions } from '../types';
import { GraphCanvas } from './GraphCanvas';
import { globalBuffers } from '../hooks/useStatsPanel';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '8px',
});

interface GraphDisplayProps {
  stats: StatsData;
  options: StatsOptions;
}

export function GraphDisplay({ stats, options }: GraphDisplayProps) {
  const targetFPS = options.targetFramerate || getTargetFrameRate();
  const thresholds = calculateThresholds(targetFPS);
  const graphHeight = options.graphHeight || 48;

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

  return (
    <Container>
      <GraphCanvas
        data={globalBuffers.fps}
        color={options.showColors !== false ? getFPSColor(stats.fps) : options.defaultColor || '#999'}
        min={0}
        max={targetFPS * 1.2}
        height={graphHeight}
        label="FPS"
        unit=""
        currentValue={stats.fps}
      />
      
      <GraphCanvas
        data={globalBuffers.ms}
        color={options.showColors !== false ? getMSColor(stats.ms) : options.defaultColor || '#999'}
        min={0}
        max={thresholds.targetMS * 2}
        height={graphHeight}
        label="Frame Time"
        unit="ms"
        currentValue={stats.ms}
      />
      
      {stats.gpuAccurate && (
        <GraphCanvas
          data={globalBuffers.gpu}
          color={options.showColors !== false ? getMSColor(stats.gpu) : options.defaultColor || '#999'}
          min={0}
          max={thresholds.targetMS * 2}
          height={graphHeight}
          label="GPU"
          unit="ms"
          currentValue={stats.gpu}
        />
      )}
      
      {options.trackCompute && stats.isWebGPU && stats.compute > 0 && (
        <GraphCanvas
          data={globalBuffers.compute}
          color={options.defaultColor || '#999'}
          min={0}
          max={thresholds.targetMS}
          height={graphHeight}
          label="Compute"
          unit="ms"
          currentValue={stats.compute}
        />
      )}
    </Container>
  );
}