// src/utils/RingBuffer.ts
export class RingBuffer {
  private buffer: Float32Array;
  private pointer: number = 0;
  private filled: boolean = false;
  public readonly size: number;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Float32Array(size);
  }

  push(value: number): void {
    this.buffer[this.pointer] = value;
    this.pointer = (this.pointer + 1) % this.size;
    if (this.pointer === 0) this.filled = true;
  }

  getLatest(): number {
    const index = (this.pointer - 1 + this.size) % this.size;
    return this.buffer[index];
  }

  getAverage(): number {
    const count = this.filled ? this.size : this.pointer;
    if (count === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.buffer[i];
    }
    return sum / count;
  }

  getMin(): number {
    const count = this.filled ? this.size : this.pointer;
    if (count === 0) return 0;
    
    let min = Infinity;
    for (let i = 0; i < count; i++) {
      if (this.buffer[i] < min) min = this.buffer[i];
    }
    return min;
  }

  getMax(): number {
    const count = this.filled ? this.size : this.pointer;
    if (count === 0) return 0;
    
    let max = -Infinity;
    for (let i = 0; i < count; i++) {
      if (this.buffer[i] > max) max = this.buffer[i];
    }
    return max;
  }

  getData(): Float32Array {
    if (!this.filled) {
      return this.buffer.slice(0, this.pointer);
    }
    
    const result = new Float32Array(this.size);
    for (let i = 0; i < this.size; i++) {
      result[i] = this.buffer[(this.pointer + i) % this.size];
    }
    return result;
  }

  forEachValue(callback: (value: number, index: number) => void): void {
    const count = this.filled ? this.size : this.pointer;
    if (count === 0) return;

    if (!this.filled) {
      // Data is contiguous from 0 to pointer
      for (let i = 0; i < count; i++) {
        callback(this.buffer[i], i);
      }
    } else {
      // Data wraps around, start from oldest (pointer position)
      for (let i = 0; i < count; i++) {
        const bufferIndex = (this.pointer + i) % this.size;
        callback(this.buffer[bufferIndex], i);
      }
    }
  }

  getCount(): number {
    return this.filled ? this.size : this.pointer;
  }

  clear(): void {
    this.buffer.fill(0);
    this.pointer = 0;
    this.filled = false;
  }
}