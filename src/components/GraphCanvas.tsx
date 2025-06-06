// src/components/GraphCanvas.tsx
import { useRef, useEffect } from 'react';
import { RingBuffer } from '../utils/buffer';
import { styles } from '../styles/styled';

interface GraphCanvasProps {
  data: RingBuffer;
  color: string;
  min: number;
  max: number;
  height: number;
  label: string;
  unit: string;
  currentValue: number;
}

export function GraphCanvas({ data, color, min, max, height, label, unit, currentValue }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;

      // Clear background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      for (let i = 0; i <= 2; i++) {
        const y = (height / 2) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);

      // Draw data without creating arrays
      const count = data.getCount();
      if (count > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const step = width / (data.size - 1);
        let firstPoint = true;
        
        data.forEachValue((value, i) => {
          const x = i * step;
          const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
          const y = height - (normalized * height);
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
      }

      // Gradient overlay for text
      const gradient = ctx.createLinearGradient(0, 0, 60, 0);
      gradient.addColorStop(0, 'rgba(26, 26, 26, 0.95)');
      gradient.addColorStop(0.7, 'rgba(26, 26, 26, 0.7)');
      gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 80, 26);

      // Draw label and value
      ctx.fillStyle = '#999';
      ctx.font = '9px monospace';
      ctx.fillText(label, 4, 10);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${currentValue.toFixed(1)}${unit}`, 4, 22);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, color, min, max, label, unit, currentValue]);

  return <canvas ref={canvasRef} style={{ ...styles.canvas, height: `${height}px` }} />;
}