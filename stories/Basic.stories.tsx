// Basic.stories.tsx
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
  order: number;
  fontSize: number;
  // Stat visibility and ordering
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
}

function Scene({ args }: { args: StoryArgs }) {
  const {
    showFPS, orderFPS,
    showMS, orderMS,
    showMemory, orderMemory,
    showGPU, orderGPU,
    showCPU, orderCPU,
    ...restArgs
  } = args;

  useStatsPanel({
    ...restArgs,
    stats: {
      fps: { show: showFPS, order: orderFPS },
      ms: { show: showMS, order: orderMS },
      memory: { show: showMemory, order: orderMemory },
      gpu: { show: showGPU, order: orderGPU },
      cpu: { show: showCPU, order: orderCPU },
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
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel (lower numbers appear first)'
    },
    fontSize: {
      control: { type: 'range', min: 8, max: 16, step: 1 },
      description: 'Font size for stats display'
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
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    vsync: true,
    order: -1,
    fontSize: 12,
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
  },
  render: (args) => <StoryComponent {...args} />
};

export const CustomOrder: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    vsync: true,
    order: -1,
    fontSize: 12,
    showFPS: true,
    orderFPS: 2,
    showMS: true,
    orderMS: 0,
    showMemory: true,
    orderMemory: 1,
    showGPU: true,
    orderGPU: 3,
    showCPU: false,
    orderCPU: 4,
  },
  render: (args) => <StoryComponent {...args} />
};