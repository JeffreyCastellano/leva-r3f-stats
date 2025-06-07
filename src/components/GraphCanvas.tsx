// src/components/GraphCanvas.tsx
import { useRef, useEffect, useMemo } from 'react';
import { RingBuffer } from '../utils/buffer';

interface GraphCanvasProps {
  data: RingBuffer;
  color: string;
  min: number;
  max: number;
  height: number;
  label: string;
  fullLabel?: string;
  unit: string;
  currentValue: number;
  backgroundColor?: string;
  gridColor?: string;
  fontSize?: number;
  showFullLabel?: boolean;
}

export function GraphCanvas({ 
  data, 
  color, 
  min, 
  max, 
  height, 
  label, 
  fullLabel,
  unit, 
  currentValue,
  backgroundColor = '#181c20',
  gridColor = '#ffffff25',
  fontSize = 9,
  showFullLabel = false
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const labelFontSize = Math.max(8, fontSize - 1);
  const displayLabel = showFullLabel && fullLabel ? fullLabel : label;
  const formattedValue = `${currentValue.toFixed(1)}${unit}`;

  // Create dashed line SVG pattern
  const dashedGridPattern = useMemo(() => {
    const dashLength = 3;
    const gapLength = 3;
    const strokeWidth = 1;
    
    return `url("data:image/svg+xml,%3Csvg width='${dashLength + gapLength}' height='${height}' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='${height/2}' x2='${dashLength}' y2='${height/2}' stroke='${encodeURIComponent(gridColor)}' stroke-width='${strokeWidth}'/%3E%3C/svg%3E")`;
  }, [gridColor, height]);

  // Memoize styles
  const styles = useMemo(() => ({
    container: {
      position: 'relative' as const,
      height: `${height}px`,
      backgroundColor,
      overflow: 'hidden',
      backgroundImage: dashedGridPattern,
      backgroundRepeat: 'repeat-x',
      backgroundPosition: 'left center',
      backgroundSize: `${8}px ${height}px` // dash + gap = 8px
    },
    canvas: {
      display: 'block',
      width: '100%',
      height: `${height}px`,
      position: 'relative' as const,
      zIndex: 1
    },
    gradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '80px',
      height: '100%',
      background: `linear-gradient(90deg, ${backgroundColor}ee 0%, ${backgroundColor}b3 70%, ${backgroundColor}00 100%)`,
      pointerEvents: 'none' as const,
      zIndex: 2
    },
    overlay: {
      position: 'absolute' as const,
      top: '3px',
      left: '3px',
      fontFamily: 'monospace',
      pointerEvents: 'none' as const,
      zIndex: 3
    },
    label: {
      fontSize: `${labelFontSize}px`,
      color: '#999',
      lineHeight: `${labelFontSize + 1}px`,
      maxWidth: showFullLabel ? '90%' : undefined,
      overflow: showFullLabel ? 'hidden' : undefined,
      textOverflow: showFullLabel ? 'ellipsis' : undefined,
      whiteSpace: showFullLabel ? 'nowrap' as const : undefined,
    },
    value: {
      fontSize: `${fontSize}px`,
      fontWeight: 'bold' as const,
      color,
      lineHeight: `${fontSize + 2}px`
    }
  }), [height, backgroundColor, gridColor, labelFontSize, fontSize, color, showFullLabel, dashedGridPattern]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let mounted = true;

    const render = () => {
      if (!mounted || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const count = data.getCount();
      if (count > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const step = width / (data.size - 1);
        const range = max - min || 1;
        let firstPoint = true;
        
        data.forEachValue((value, i) => {
          const x = i * step;
          const y = height - (Math.max(0, Math.min(1, (value - min) / range)) * height);
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
      }

      if (mounted) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, color, min, max]);

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.gradient} />
      <div style={styles.overlay}>
        <div style={styles.label}>{displayLabel}</div>
        <div style={styles.value}>{formattedValue}</div>
      </div>
    </div>
  );
}