import React from 'react';
import { StatsData, StatsOptions } from '../types';
import { MinMaxTracker } from '../utils/buffers';
import { formatFPS, formatMS, formatMemory, formatGPU, formatTo3Digits, formatTriangles } from '../utils/formatters';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import {
  StatsContainer,
  StatItem,
  StatLabel,
  StatValue,
  MinMaxValue
} from '../styles/styled';

interface GridDisplayProps {
  stats: StatsData;
  options: StatsOptions;
  minMaxTrackers: Record<string, MinMaxTracker>;
}

export function GridDisplay({ stats, options, minMaxTrackers }: GridDisplayProps) {
  const showMinMax = options.showMinMax !== false;
  const showTriangles = options.showTriangles || false;

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

  const { fps, ms, memory, gpu, triangles, drawCalls } = stats;

  return (
    <>
      <StatsContainer>
        <StatItem>
          <StatLabel>
            FPS (target: {targetFPS})
          </StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getFPSColor(fps) : options.defaultColor
          }}>
            {formatFPS(fps)}
            {showMinMax && (
              <MinMaxValue>
                {formatFPS(minMaxTrackers.fps.getMin())}-{formatFPS(minMaxTrackers.fps.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>MS (target: {thresholds.targetMS.toFixed(1)})</StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getMSColor(ms) : options.defaultColor
          }}>
            {formatMS(ms)}
            {showMinMax && (
              <MinMaxValue>
                {formatMS(minMaxTrackers.ms.getMin())}-{formatMS(minMaxTrackers.ms.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>Memory (MB)</StatLabel>
          <StatValue style={{
            color: options.defaultColor || undefined
          }}>
            {formatMemory(memory)}
            {showMinMax && (
              <MinMaxValue>
                {formatMemory(minMaxTrackers.memory.getMin())}-{formatMemory(minMaxTrackers.memory.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>GPU (ms)</StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getMSColor(parseFloat(gpu.toString())) : options.defaultColor
          }}>
            {formatGPU(gpu)}
            {showMinMax && (
              <MinMaxValue>
                {formatGPU(minMaxTrackers.gpu.getMin())}-{formatGPU(minMaxTrackers.gpu.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItem>
      </StatsContainer>

      {options.trackCompute && stats.isWebGPU && (
        <StatItem>
          <StatLabel>Compute (ms)</StatLabel>
          <StatValue style={{
            color: options.showColors !== false ? getMSColor(stats.compute) : options.defaultColor
          }}>
            {formatMS(stats.compute)}
            {showMinMax && (
              <MinMaxValue>
                {formatMS(minMaxTrackers.compute.getMin())}-{formatMS(minMaxTrackers.compute.getMax())}
              </MinMaxValue>
            )}
          </StatValue>
        </StatItem>
      )}

      {showTriangles && (
        <StatsContainer style={{ gridTemplateColumns: '1fr 1fr', marginTop: '8px' }}>
          <StatItem>
            <StatLabel>Triangles</StatLabel>
            <StatValue style={{
              color: options.defaultColor || undefined
            }}>
              {formatTriangles(triangles)}
              {showMinMax && (
                <MinMaxValue>
                  {formatTriangles(minMaxTrackers.triangles.getMin())}-{formatTriangles(minMaxTrackers.triangles.getMax())}
                </MinMaxValue>
              )}
            </StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>Draw Calls</StatLabel>
            <StatValue style={{
              color: options.defaultColor || undefined
            }}>
              {formatTo3Digits(drawCalls)}
              {showMinMax && (
                <MinMaxValue>
                  {formatTo3Digits(minMaxTrackers.drawCalls.getMin())}-{formatTo3Digits(minMaxTrackers.drawCalls.getMax())}
                </MinMaxValue>
              )}
            </StatValue>
          </StatItem>
        </StatsContainer>
      )}
    </>
  );
}