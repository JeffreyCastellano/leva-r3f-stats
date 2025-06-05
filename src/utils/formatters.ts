export function formatTo3Digits(value: number | null | undefined, unit: string = ''): string {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
    const num = parseFloat(value.toString());
  
    // For values less than 1
    if (num < 1) {
      return num.toFixed(2); // 0.12
    }
    // For values 1-9.99
    else if (num < 10) {
      return num.toFixed(1); // 1.2, 9.9
    }
    // For values 10-999
    else if (num < 1000) {
      return Math.round(num).toString(); // 10, 123, 999
    }
    // For values 1000+
    else {
      // Convert to next unit
      if (unit === 'MB') {
        const gb = num / 1024;
        if (gb < 10) {
          return gb.toFixed(1) + 'G'; // 1.2G
        } else if (gb < 100) {
          return Math.round(gb) + 'G'; // 12G, 99G
        } else {
          return Math.round(gb) + 'G'; // 123G
        }
      } else if (unit === 'ms') {
        const s = num / 1000;
        if (s < 10) {
          return s.toFixed(1) + 's'; // 1.2s
        } else {
          return Math.round(s) + 's'; // 12s
        }
      }
      // Fallback for large numbers
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