// components/GridDisplay.tsx
import React from 'react';
import { StatsData, StatsOptions } from '../types';
import { formatFPS, formatMS, formatMemory, formatGPU, formatTo3Digits, formatTriangles } from '../utils/formatters';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import { globalBuffers } from '../hooks/useStatsPanel';
import {
  StatsGridContainer,
  StatItemContainer,
  StatLabel,
  StatValue,
  MinMaxValue
} from '../styles/styled';

interface GridDisplayProps {
  stats: StatsData;
  options: StatsOptions;
}

export function GridDisplay({ stats, options }: GridDisplayProps) {
  const showMinMax = options.showMinMax !== false;

  let targetFPS: number;
  if (options.targetFramerate && options.targetFramerate > 0) {
    targetFPS = options.targetFramerate;
  } else {
    targetFPS = getTargetFrameRate();
  }

  const thresholds = calculateThresholds(targetFPS);

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

  const { fps, ms, memory, gpu } = stats;

  return (
    <>
      <StatsGridContainer>
        <StatItemContainer>
          <StatLabel>
            FPS (target: {targetFPS})
          </StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getFPSColor(fps) : options.defaultColor
          }}>
            {formatFPS(fps)}
            {showMinMax && (
              <MinMaxValue>
                {formatFPS(globalBuffers.fps.getMin())}-{formatFPS(globalBuffers.fps.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItemContainer>

        <StatItemContainer>
          <StatLabel>MS (target: {thresholds.targetMS.toFixed(1)})</StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getMSColor(ms) : options.defaultColor
          }}>
            {formatMS(ms)}
            {showMinMax && (
              <MinMaxValue>
                {formatMS(globalBuffers.ms.getMin())}-{formatMS(globalBuffers.ms.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItemContainer>

        <StatItemContainer>
          <StatLabel>Memory (MB)</StatLabel>
          <StatValue style={{
            color: options.defaultColor || undefined
          }}>
            {formatMemory(memory)}
            {showMinMax && (
              <MinMaxValue>
                {formatMemory(globalBuffers.memory.getMin())}-{formatMemory(globalBuffers.memory.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItemContainer>

        <StatItemContainer>
          <StatLabel>GPU (ms)</StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getMSColor(parseFloat(gpu.toString())) : options.defaultColor
          }}>
            {formatGPU(gpu)}
            {showMinMax && (
              <MinMaxValue>
                {formatGPU(globalBuffers.gpu.getMin())}-{formatGPU(globalBuffers.gpu.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItemContainer>
      </StatsGridContainer>

      {options.trackCompute && stats.isWebGPU && stats.compute > 0 && (
        <StatsGridContainer>
          <StatItemContainer>
            <StatLabel>Compute (ms)</StatLabel>
            <StatValue style={{
              color: options.showColors !== false ? getMSColor(stats.compute) : options.defaultColor
            }}>
              {formatMS(stats.compute)}
              {showMinMax && (
                <MinMaxValue>
                  {formatMS(globalBuffers.compute.getMin())}-{formatMS(globalBuffers.compute.getMax())}
                </MinMaxValue>
              )}
            </StatValue>
          </StatItemContainer>
        </StatsGridContainer>
      )}
    </>
  );
}