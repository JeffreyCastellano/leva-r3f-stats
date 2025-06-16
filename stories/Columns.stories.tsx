import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';

interface StoryArgs {
  columns: number;
  columnsCompact: number;
  compact: boolean;
  graphHeight: number;
  gpuPercentage: boolean;
  fontSize: number;
  showFullLabels: boolean;
}

function Scene({ args }: { args: StoryArgs }) {
  useStatsPanel(args);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {Array.from({ length: 20 }).map((_, i) => (
        <Box key={i} position={[(i % 5) * 2 - 4, Math.floor(i / 5) - 1.5, 0]} scale={0.8}>
          <meshStandardMaterial color={`hsl(${i * 18}, 70%, 50%)`} />
        </Box>
      ))}
      <OrbitControls />
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva 
        key="columns-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Columns',
  component: StoryComponent,
  argTypes: {
    columns: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
      description: 'Number of columns (used in normal and graph mode)'
    },
    columnsCompact: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Columns in compact mode'
    },
    compact: {
      control: 'boolean',
      description: 'Enable compact mode'
    },
    graphHeight: {
      control: { type: 'range', min: 6, max: 48, step: 8 },
      description: 'Graph height (0 for text mode)'
    },
    fontSize: {
      control: { type: 'range', min: 6, max: 16, step: 1 },
      description: 'Font size for all modes'
    },
    showFullLabels: {
      control: 'boolean',
      description: 'Show full labels in graph mode'
    },
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomColumns: StoryObj<StoryArgs> = {
  args: {
    columns: 2,
    columnsCompact: 4,
    compact: false,
    graphHeight: 0,
    fontSize: 10,
    gpuPercentage: false,
    showFullLabels: false,
  }
};

export const ThreeColumnLayout: StoryObj<StoryArgs> = {
  args: {
    columns: 3,
    columnsCompact: 3,
    compact: false,
    graphHeight: 32,
    gpuPercentage: false,
    fontSize: 10,
    showFullLabels: false,
  }
};

export const SingleColumn: StoryObj<StoryArgs> = {
  args: {
    columns: 1,
    columnsCompact: 1,
    compact: true,
    graphHeight: 0,
    gpuPercentage: false,
    fontSize: 10,
    showFullLabels: false,
  }
};

export const WideCompact: StoryObj<StoryArgs> = {
  args: {
    columns: 2,
    columnsCompact: 6,
    compact: true,
    graphHeight: 0,
    gpuPercentage: false,
    fontSize: 8,
    showFullLabels: false,
  }
};