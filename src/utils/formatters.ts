const formatWithScale = (value: number, scales: [number, string][]): string => {
  for (const [threshold, suffix] of scales) {
    if (value >= threshold) {
      const scaled = value / threshold;
      return scaled < 10 ? scaled.toFixed(1) + suffix : Math.round(scaled) + suffix;
    }
  }
  return value.toString();
};

export function formatTo3Digits(value: number | null | undefined, unit: string = ''): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';

  const num = parseFloat(value.toString());

  if (num < 1) {
    return num.toFixed(2);
  } else if (num < 10) {
    return num.toFixed(1);
  } else if (num < 1000) {
    return Math.round(num).toString();
  } else {
    if (unit === 'MB') {
      return formatWithScale(num, [[1024, 'G']]);
    } else if (unit === 'ms') {
      return formatWithScale(num, [[1000, 's']]);
    }
    return '999+';
  }
}

export const formatFPS = (fps: number): string => formatTo3Digits(fps);
export const formatMS = (ms: number): string => formatTo3Digits(ms, 'ms');
export const formatMemory = (mb: number): string => formatTo3Digits(mb, 'MB');
export const formatGPU = (ms: number): string => formatTo3Digits(ms, 'ms');
export const formatCPU = (ms: number): string => formatTo3Digits(ms, 'ms');

export function formatTriangles(count: number): string {
  if (count === null || count === undefined || isNaN(count)) return 'N/A';
  
  const scales: [number, string][] = [
    [1000000000, 'B'],
    [1000000, 'M'],
    [1000, 'K']
  ];
  
  return formatWithScale(count, scales);
}

export function formatVSync(vsync: number | null): string {
  return vsync === null ? 'N/A' : `${vsync}Hz`;
}

export const formatPercent = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${Math.round(value)}%`;
};