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
  showTriangles: boolean;
  vsync: boolean;
  order: number;
}

function Scene({ args }: { args: StoryArgs }) {
  useStatsPanel({ ...args, compact: true });

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
        key="compact-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Compact',
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
    showTriangles: {
      control: 'boolean',
      description: 'Show triangle and draw call counts'
    },
    vsync: {
      control: 'boolean',
      description: 'Enable VSync detection'
    },
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel (lower numbers appear first)'
    }
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
    showTriangles: false,
    vsync: true,
    order: -1
  }
};