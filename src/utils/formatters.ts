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
      const gb = num / 1024;
      if (gb < 10) {
        return gb.toFixed(1) + 'G';
      } else if (gb < 100) {
        return Math.round(gb) + 'G';
      } else {
        return Math.round(gb) + 'G';
      }
    } else if (unit === 'ms') {
      const s = num / 1000;
      if (s < 10) {
        return s.toFixed(1) + 's';
      } else {
        return Math.round(s) + 's';
      }
    }
    return '999+';
  }
}

export function formatFPS(fps: number): string {
  return formatTo3Digits(fps);
}

export function formatMS(ms: number): string {
  return formatTo3Digits(ms, 'ms');
}

export function formatMemory(mb: number): string {
  return formatTo3Digits(mb, 'MB');
}

export function formatGPU(ms: number): string {
  return formatTo3Digits(ms, 'ms');
}

export function formatCPU(ms: number): string {
  return formatTo3Digits(ms, 'ms');
}

export function formatTriangles(count: number): string {
  if (count === null || count === undefined || isNaN(count)) return 'N/A';

  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1) + 'K';
  } else if (count < 1000000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else {
    return (count / 1000000000).toFixed(1) + 'B';
  }
}

export function formatVSync(vsync: number | null): string {
  if (vsync === null) return 'N/A';
  return `${vsync}Hz`;
}