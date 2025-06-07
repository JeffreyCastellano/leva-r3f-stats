// colors.ts - Enhanced with geometry budget colors
import { Thresholds } from '../types';

export const getStatColor = (
  value: number,
  thresholds: Thresholds,
  type: 'fps' | 'ms' | 'gpu' | 'triangles' | 'drawCalls' | 'default'
): string => {
  if (type === 'fps') {
    if (value < thresholds.fpsCritical) return '#ff6b6b';
    if (value < thresholds.fpsWarning) return '#ffd93d';
    return '#51cf66';
  }
  
  if (type === 'ms' || type === 'gpu') {
    if (value > thresholds.msCritical) return '#ff6b6b';
    if (value > thresholds.msWarning) return '#ffd93d';
    return '#51cf66';
  }
  
  if (type === 'triangles') {
    if (value > thresholds.trianglesCritical) return '#ff6b6b';
    if (value > thresholds.trianglesWarning) return '#ffd93d';
    return '#51cf66';
  }
  
  if (type === 'drawCalls') {
    if (value > thresholds.drawCallsCritical) return '#ff6b6b';
    if (value > thresholds.drawCallsWarning) return '#ffd93d';
    return '#51cf66';
  }
  
  return '#999999';
};