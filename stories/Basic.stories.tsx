import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';

interface StoryArgs {
  updateInterval: number;
  targetFramerate: number | null;
  showColors: boolean;
  defaultColor: string;
  showMinMax: boolean;
  vsync: boolean;
  trackCompute: boolean;
  order: number;
  fontSize: number;
  graphHeight: number;
  compact: boolean;
  showFPS: boolean;
  orderFPS: number;
  showMS: boolean;
  orderMS: number;
  showMemory: boolean;
  orderMemory: number;
  showGPU: boolean;
  orderGPU: number;
  showCPU: boolean;
  orderCPU: number;
  showCompute: boolean;
  orderCompute: number;
  showTriangles: boolean;
  orderTriangles: number;
  showDrawCalls: boolean;
  orderDrawCalls: number;
  showVSync: boolean;
  orderVSync: number;
  // Smoothing props
  smoothingEnabled: boolean;
  smoothingTimingSamples: number;
  smoothingTimingThreshold: number;
  smoothingGeometrySamples: number;
  smoothingGeometryThreshold: number;
  smoothingMemorySamples: number;
  smoothingMemoryThreshold: number;
}

function Scene({ args }: { args: StoryArgs }) {
  const {
    showFPS, orderFPS,
    showMS, orderMS,
    showMemory, orderMemory,
    showGPU, orderGPU,
    showCPU, orderCPU,
    showCompute, orderCompute,
    showTriangles, orderTriangles,
    showDrawCalls, orderDrawCalls,
    showVSync, orderVSync,
    smoothingEnabled,
    smoothingTimingSamples,
    smoothingTimingThreshold,
    smoothingGeometrySamples,
    smoothingGeometryThreshold,
    smoothingMemorySamples,
    smoothingMemoryThreshold,
    ...restArgs
  } = args;

  // Build smoothing config
  const smoothingConfig = smoothingEnabled ? {
    enabled: true,
    timing: { 
      maxSamples: smoothingTimingSamples, 
      outlierThreshold: smoothingTimingThreshold 
    },
    geometry: { 
      maxSamples: smoothingGeometrySamples, 
      outlierThreshold: smoothingGeometryThreshold 
    },
    memory: { 
      maxSamples: smoothingMemorySamples, 
      outlierThreshold: smoothingMemoryThreshold 
    }
  } : false;

  useStatsPanel({
    ...restArgs,
    smoothing: smoothingConfig,
    stats: {
      fps: { show: showFPS, order: orderFPS },
      ms: { show: showMS, order: orderMS },
      memory: { show: showMemory, order: orderMemory },
      gpu: { show: showGPU, order: orderGPU },
      cpu: { show: showCPU, order: orderCPU },
      compute: { show: showCompute, order: orderCompute },
      triangles: { show: showTriangles, order: orderTriangles },
      drawCalls: { show: showDrawCalls, order: orderDrawCalls },
      vsync: { show: showVSync, order: orderVSync }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
      <Box position={[1.2, 0, 0]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <OrbitControls />
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva 
        key="basic-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Basic',
  component: StoryComponent,
  argTypes: {
    updateInterval: {
      control: { type: 'range', min: 50, max: 500, step: 50 },
      description: 'How often to update stats (ms)'
    },
    targetFramerate: {
      control: { type: 'select' },
      options: [null, 30, 60, 90, 120, 144, 165, 240],
      description: 'Target FPS (null = auto-detect)'
    },
    showColors: {
      control: 'boolean',
      description: 'Show performance-based colors'
    },
    defaultColor: {
      control: 'color',
      description: 'Default text color when showColors is false'
    },
    showMinMax: {
      control: 'boolean',
      description: 'Show min/max values'
    },
    vsync: {
      control: 'boolean',
      description: 'Enable VSync detection'
    },
    trackCompute: {
      control: 'boolean',
      description: 'Track WebGPU compute (experimental)'
    },
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel'
    },
    fontSize: {
      control: { type: 'range', min: 6, max: 16, step: 1 },
      description: 'Font size for stats display'
    },
    graphHeight: {
      control: { type: 'range', min: 0, max: 64, step: 8 },
      description: 'Graph height (0 = text mode)'
    },
    compact: {
      control: 'boolean',
      description: 'Use compact display mode'
    },
    // Smoothing controls
    smoothingEnabled: {
      control: 'boolean',
      description: 'Enable metric smoothing'
    },
    smoothingTimingSamples: {
      control: { type: 'range', min: 3, max: 30, step: 1 },
      description: 'Samples for timing metrics (GPU/CPU)'
    },
    smoothingTimingThreshold: {
      control: { type: 'range', min: 1.0, max: 5.0, step: 0.5 },
      description: 'Outlier threshold for timing metrics'
    },
    smoothingGeometrySamples: {
      control: { type: 'range', min: 3, max: 20, step: 1 },
      description: 'Samples for geometry metrics (triangles/draws)'
    },
    smoothingGeometryThreshold: {
      control: { type: 'range', min: 1.0, max: 5.0, step: 0.5 },
      description: 'Outlier threshold for geometry metrics'
    },
    smoothingMemorySamples: {
      control: { type: 'range', min: 5, max: 50, step: 5 },
      description: 'Samples for memory metrics'
    },
    smoothingMemoryThreshold: {
      control: { type: 'range', min: 1.0, max: 5.0, step: 0.5 },
      description: 'Outlier threshold for memory metrics'
    },
    // Individual stat controls
    showFPS: { control: 'boolean', description: 'Show FPS stat' },
    orderFPS: { control: { type: 'number', min: 0, max: 10 }, description: 'FPS display order' },
    showMS: { control: 'boolean', description: 'Show MS stat' },
    orderMS: { control: { type: 'number', min: 0, max: 10 }, description: 'MS display order' },
    showMemory: { control: 'boolean', description: 'Show Memory stat' },
    orderMemory: { control: { type: 'number', min: 0, max: 10 }, description: 'Memory display order' },
    showGPU: { control: 'boolean', description: 'Show GPU stat' },
    orderGPU: { control: { type: 'number', min: 0, max: 10 }, description: 'GPU display order' },
    showCPU: { control: 'boolean', description: 'Show CPU stat' },
    orderCPU: { control: { type: 'number', min: 0, max: 10 }, description: 'CPU display order' },
    showCompute: { control: 'boolean', description: 'Show Compute stat' },
    orderCompute: { control: { type: 'number', min: 0, max: 10 }, description: 'Compute display order' },
    showTriangles: { control: 'boolean', description: 'Show Triangles stat' },
    orderTriangles: { control: { type: 'number', min: 0, max: 10 }, description: 'Triangles display order' },
    showDrawCalls: { control: 'boolean', description: 'Show Draw Calls stat' },
    orderDrawCalls: { control: { type: 'number', min: 0, max: 10 }, description: 'Draw Calls display order' },
    showVSync: { control: 'boolean', description: 'Show VSync stat' },
    orderVSync: { control: { type: 'number', min: 0, max: 10 }, description: 'VSync display order' },
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    vsync: true,
    trackCompute: false,
    order: -1,
    fontSize: 12,
    graphHeight: 0,
    compact: false,
    smoothingEnabled: true,
    smoothingTimingSamples: 10,
    smoothingTimingThreshold: 2.5,
    smoothingGeometrySamples: 5,
    smoothingGeometryThreshold: 3.0,
    smoothingMemorySamples: 20,
    smoothingMemoryThreshold: 2.0,
    showFPS: true,
    orderFPS: 0,
    showMS: true,
    orderMS: 1,
    showMemory: true,
    orderMemory: 2,
    showGPU: true,
    orderGPU: 3,
    showCPU: true,
    orderCPU: 4,
    showCompute: false,
    orderCompute: 5,
    showTriangles: true,
    orderTriangles: 6,
    showDrawCalls: true,
    orderDrawCalls: 7,
    showVSync: true,
    orderVSync: 8,
  }
};

export const NoSmoothing: Story = {
  name: 'No Smoothing (Raw Values)',
  args: {
    ...Default.args,
    smoothingEnabled: false,
    graphHeight: 48,
    showMinMax: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows raw, unsmoothed values. Notice the jitter in GPU/CPU timings and geometry counts.'
      }
    }
  }
};

export const AggressiveSmoothing: Story = {
  name: 'Aggressive Smoothing',
  args: {
    ...Default.args,
    smoothingEnabled: true,
    smoothingTimingSamples: 20,      // More samples for very smooth timing
    smoothingTimingThreshold: 2.0,   // Lower threshold, more aggressive outlier rejection
    smoothingGeometrySamples: 15,    // More samples for geometry
    smoothingGeometryThreshold: 2.5, // Aggressive outlier rejection
    smoothingMemorySamples: 40,      // Many samples for memory
    smoothingMemoryThreshold: 1.5,   // Very aggressive outlier rejection
    graphHeight: 48,
  },
  parameters: {
    docs: {
      description: {
        story: 'Uses aggressive smoothing settings for very stable readings. Good for on-demand rendering or scenes with sporadic updates.'
      }
    }
  }
};

export const LightSmoothing: Story = {
  name: 'Light Smoothing',
  args: {
    ...Default.args,
    smoothingEnabled: true,
    smoothingTimingSamples: 5,       // Fewer samples, more responsive
    smoothingTimingThreshold: 4.0,   // Higher threshold, less outlier rejection
    smoothingGeometrySamples: 3,     // Very few samples
    smoothingGeometryThreshold: 4.5, // Minimal outlier rejection
    smoothingMemorySamples: 10,      // Fewer memory samples
    smoothingMemoryThreshold: 4.0,   // Less aggressive
    graphHeight: 48,
  },
  parameters: {
    docs: {
      description: {
        story: 'Light smoothing that preserves more real-time responsiveness while still reducing noise.'
      }
    }
  }
};

export const SmoothingComparison: Story = {
  name: 'Smoothing Comparison (Toggle in Controls)',
  args: {
    ...Default.args,
    smoothingEnabled: true,
    graphHeight: 48,
    showMinMax: true,
    updateInterval: 50, // Faster updates to see difference
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle the "smoothingEnabled" control to see the difference between smoothed and raw values in real-time. Watch GPU/CPU timing stability.'
      }
    }
  }
};

export const CustomOrder: Story = {
  args: {
    ...Default.args,
    showFPS: true,
    orderFPS: 2,
    showMS: true,
    orderMS: 0,
    showMemory: true,
    orderMemory: 1,
    showGPU: true,
    orderGPU: 3,
    showCPU: false,
    showTriangles: true,
    orderTriangles: 4,
    showDrawCalls: true,
    orderDrawCalls: 5,
    showVSync: false,
  }
};

export const MinimalStats: Story = {
  args: {
    ...Default.args,
    compact: true,
    fontSize: 10,
    showFPS: true,
    showGPU: true,
    showMS: false,
    showMemory: false,
    showCPU: false,
    showCompute: false,
    showTriangles: false,
    showDrawCalls: false,
    showVSync: false,
  }
};

export const ToggleStatOptions: Story = {
  args: {
    ...Default.args,
    trackCompute: true,
    graphHeight: 32,
    showFPS: true,
    showMS: true,
    showMemory: true,
    showGPU: true,
    showCPU: true,
    showCompute: true,
    showTriangles: true,
    showDrawCalls: true,
    showVSync: true,
  }
};