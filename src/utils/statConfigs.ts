import { StatConfig, StatsOptions, Thresholds } from '../types';
import { unifiedStore } from '../store/unifiedStore';

const getLabels = (options: StatsOptions) => ({
  fps: 'FPS',
  ms: 'MS',
  memory: 'MEM',
  gpu: options.gpuPercentage ? 'GPU%' : 'GPU',  // Dynamic label
  cpu: 'CPU',
  compute: 'COMP',
  triangles: 'TRI',
  drawCalls: 'DRW',
  vsync: 'VSYNC'
});

const FORMATS = {
  fps: (v: number) => v.toFixed(0),
  ms: (v: number) => v.toFixed(1),
  memory: (v: number) => v.toFixed(0),
  gpu: (v: number, options?: { gpuPercentage?: boolean }) => {
    if (options?.gpuPercentage) {
      return v.toFixed(0) + '%';
    }
    return v.toFixed(1);
  },
  cpu: (v: number) => v.toFixed(1),
  compute: (v: number) => v.toFixed(1),
  triangles: (v: number) => {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toString();
  },
  drawCalls: (v: number) => v.toFixed(0),
  vsync: (v: number | null) => v ? `${v}Hz` : 'Detecting...'
};

const getColor = (value: number, good: number, bad: number, invert = false): string => {
  const ratio = invert 
    ? (bad - value) / (bad - good)
    : (value - good) / (bad - good);
  
  if (ratio <= 0) return '#51cf66';
  if (ratio >= 1) return '#ff6b6b';
  return '#ffd93d';
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  fpsWarning: 48,
  fpsCritical: 30,
  msWarning: 20,
  msCritical: 33,
  gpuWarning: 20,
  gpuCritical: 33,
  targetFPS: 60,
  targetMS: 16.67,
  trianglesBudget: 1000000,
  drawCallsBudget: 1000,
  trianglesWarning: 800000,
  trianglesCritical: 1200000,
  drawCallsWarning: 800,
  drawCallsCritical: 1200
};

export function createStatConfigs(options: StatsOptions, thresholds: Thresholds = DEFAULT_THRESHOLDS): StatConfig[] {
  const stats = options.stats || {};
  const peaks = unifiedStore.getPeaks();
  const LABELS = getLabels(options); 
  return Object.entries(LABELS)
    .filter(([key]) => {
      if (key === 'compute' && !options.trackCompute) return false;
      if (key === 'vsync' && options.vsync === false) return false;
      return stats[key as keyof typeof stats]?.show !== false;
    })
    .map(([key, label]) => {
      const statKey = key as keyof typeof LABELS;
      const order = stats[statKey]?.order ?? Object.keys(LABELS).indexOf(statKey);
      
      let color = undefined;
      let graphMax = 100;
      let labelSuffix = undefined;
      
      switch (statKey) {
        case 'fps':
          color = (v: number) => getColor(v, thresholds.fpsCritical, thresholds.fpsWarning, true);
          graphMax = thresholds.targetFPS * 1.2;
          labelSuffix = `MAX: ${thresholds.targetFPS}`;
          break;
        case 'ms':
          color = (v: number) => getColor(v, thresholds.msWarning, thresholds.msCritical);
          graphMax = thresholds.targetMS * 2;
          labelSuffix = `MAX: ${thresholds.targetMS.toFixed(1)}ms`;
          break;
        case 'gpu':
        if (options.gpuPercentage) {
          color = (v: number) => {
            // Color based on percentage thresholds
            if (v > 90) return '#ff6b6b';  // Critical: >90%
            if (v > 70) return '#ffd93d';  // Warning: >70%
            return '#51cf66';  // Good: <70%
          };
          graphMax = 100;  // Percentage max
          labelSuffix = '';
        } else {
          color = (v: number) => getColor(v, thresholds.msWarning, thresholds.msCritical);
          graphMax = thresholds.targetMS * 2;
        }
        break;
        case 'cpu':
          color = (v: number) => getColor(v, thresholds.msWarning, thresholds.msCritical);
          graphMax = thresholds.targetMS * 2;
          break;
        case 'triangles':
          color = (v: number) => getColor(v, thresholds.trianglesWarning, thresholds.trianglesCritical);
          graphMax = Math.max(thresholds.trianglesBudget * 1.5, peaks.triangles * 1.2);
          labelSuffix = peaks.triangles > 0 
            ? `MAX: ${FORMATS.triangles(peaks.triangles)}`
            : `MAX: ${FORMATS.triangles(thresholds.trianglesBudget)}`;
          break;
        case 'drawCalls':
          color = (v: number) => getColor(v, thresholds.drawCallsWarning, thresholds.drawCallsCritical);
          graphMax = Math.max(thresholds.drawCallsBudget * 1.5, peaks.drawCalls * 1.2);
          labelSuffix = peaks.drawCalls > 0
            ? `MAX: ${peaks.drawCalls}`
            : `MAX: ${thresholds.drawCallsBudget}`;
          break;
      }
      
      return {
        key: statKey,
        label: label,
        labelSuffix,
        shortLabel: label,
        unit: statKey === 'memory' ? 'MB' : statKey === 'vsync' ? 'Hz' : '',
        format: FORMATS[statKey],
        color,
        show: true,
        order,
        showInCompact: statKey !== 'cpu' && statKey !== 'vsync',
        graphMin: 0,
        graphMax: () => graphMax
      } as StatConfig;
    })
    .sort((a, b) => a.order - b.order);
}

export function getVisibleConfigs(
  configs: StatConfig[], 
  stats: any, 
  compact: boolean = false
): StatConfig[] {
  return configs.filter(config => {
    if (compact && !config.showInCompact) return false;
    if (config.key === 'compute' && (!stats.isWebGPU || stats.compute === 0)) return false;
    // Remove this line that hides vsync panel:
    // if (config.key === 'vsync' && !stats.vsync) return false;
    if (config.key === 'cpu' && !stats.gpuAccurate) return false;
    return true;
  });
}