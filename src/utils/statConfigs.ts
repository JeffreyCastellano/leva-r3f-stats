import { StatConfig, Thresholds } from '../types';
import { formatFPS, formatMS, formatMemory, formatGPU, formatCPU, formatTriangles, formatTo3Digits, formatVSync } from './formatters';

export function createStatConfigs(options: any, thresholds: Thresholds): StatConfig[] {
  const configs: StatConfig[] = [
    {
      key: 'fps',
      label: `FPS (target: ${thresholds.targetFPS})`,
      shortLabel: 'FPS',
      unit: '',
      format: formatFPS,
      color: (value: number) => {
        if (value < thresholds.fpsCritical) return '#ff6b6b';
        if (value < thresholds.fpsWarning) return '#ffd93d';
        return '#51cf66';
      },
      show: options.stats?.fps?.show !== false,
      order: options.stats?.fps?.order ?? 0,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => thresholds.targetFPS * 1.2
    },
    {
      key: 'ms',
      label: `MS (target: ${thresholds.targetMS.toFixed(1)})`,
      shortLabel: 'MS',
      unit: 'ms',
      format: formatMS,
      color: (value: number) => {
        if (value > thresholds.msCritical) return '#ff6b6b';
        if (value > thresholds.msWarning) return '#ffd93d';
        return '#51cf66';
      },
      show: options.stats?.ms?.show !== false,
      order: options.stats?.ms?.order ?? 1,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => thresholds.targetMS * 2
    },
    {
      key: 'memory',
      label: 'Memory (MB)',
      shortLabel: 'MEM',
      unit: 'MB',
      format: formatMemory,
      show: options.stats?.memory?.show !== false,
      order: options.stats?.memory?.order ?? 2,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => 1024
    },
    {
      key: 'gpu',
      label: 'GPU (ms)',
      shortLabel: 'GPU',
      unit: 'ms',
      format: formatGPU,
      color: (value: number) => {
        if (value > thresholds.gpuCritical) return '#ff6b6b';
        if (value > thresholds.gpuWarning) return '#ffd93d';
        return '#51cf66';
      },
      show: options.stats?.gpu?.show !== false,
      order: options.stats?.gpu?.order ?? 3,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => thresholds.targetMS * 2
    },
    {
      key: 'cpu',
      label: 'CPU (ms)',
      shortLabel: 'CPU',
      unit: 'ms',
      format: formatCPU,
      color: (value: number) => {
        if (value > thresholds.msCritical) return '#ff6b6b';
        if (value > thresholds.msWarning) return '#ffd93d';
        return '#51cf66';
      },
      show: options.stats?.cpu?.show !== false,
      order: options.stats?.cpu?.order ?? 4,
      showInCompact: false,
      graphMin: 0,
      graphMax: () => thresholds.targetMS * 2
    },
    {
      key: 'compute',
      label: 'Compute (ms)',
      shortLabel: 'COMP',
      unit: 'ms',
      format: formatMS,
      color: (value: number) => {
        if (value > thresholds.msCritical) return '#ff6b6b';
        if (value > thresholds.msWarning) return '#ffd93d';
        return '#51cf66';
      },
      show: options.trackCompute === true && options.stats?.compute?.show !== false,
      order: options.stats?.compute?.order ?? 5,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => thresholds.targetMS
    },
    {
      key: 'triangles',
      label: 'Triangles',
      shortLabel: 'TRI',
      unit: '',
      format: formatTriangles,
      show: options.stats?.triangles?.show !== false,
      order: options.stats?.triangles?.order ?? 6,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => 1000000
    },
    {
      key: 'drawCalls',
      label: 'Draw Calls',
      shortLabel: 'DRW',
      unit: '',
      format: formatTo3Digits,
      show: options.stats?.drawCalls?.show !== false, 
      order: options.stats?.drawCalls?.order ?? 7,
      showInCompact: true,
      graphMin: 0,
      graphMax: () => 1000
    },
    {
      key: 'vsync',
      label: 'VSync',
      shortLabel: '',
      unit: 'Hz',
      format: formatVSync,
      show: options.vsync !== false && options.stats?.vsync?.show !== false,
      order: options.stats?.vsync?.order ?? 8,
      showInCompact: false
    }
  ];

  return configs.filter(config => config.show).sort((a, b) => a.order - b.order);
}