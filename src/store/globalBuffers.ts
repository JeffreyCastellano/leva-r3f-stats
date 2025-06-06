import { RingBuffer } from '../utils/RingBuffer';

export const globalBuffers = {
  fps: new RingBuffer(100),
  ms: new RingBuffer(100),
  memory: new RingBuffer(100),
  gpu: new RingBuffer(100),
  cpu: new RingBuffer(100),
  compute: new RingBuffer(100),
  triangles: new RingBuffer(100),
  drawCalls: new RingBuffer(100)
};