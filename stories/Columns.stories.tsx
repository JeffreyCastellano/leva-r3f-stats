import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';

interface StoryArgs {
  columns: number;
  columnsCompact: number;
  columnsGraph: number;
  compact: boolean;
  graphHeight: number;
  fontSize: number;
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
      description: 'Default columns (used when columnsCompact/columnsGraph not set)'
    },
    columnsCompact: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Columns in compact mode'
    },
    columnsGraph: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'Columns in graph mode'
    },
    compact: {
      control: 'boolean',
      description: 'Enable compact mode'
    },
    graphHeight: {
      control: { type: 'range', min: 0, max: 48, step: 8 },
      description: 'Graph height (0 for text mode)'
    },
    fontSize: {
      control: { type: 'range', min: 8, max: 16, step: 1 },
      description: 'Font size for all modes'
    },
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomColumns: StoryObj<StoryArgs> = {
  args: {
    columns: 2,
    columnsCompact: 4,
    columnsGraph: 2,
    compact: false,
    graphHeight: 0,
    fontSize: 12,
  }
};

export const ThreeColumnLayout: StoryObj<StoryArgs> = {
  args: {
    columns: 3,
    columnsCompact: 3,
    columnsGraph: 3,
    compact: false,
    graphHeight: 32,
    fontSize: 12,
  }
};

export const SingleColumn: StoryObj<StoryArgs> = {
  args: {
    columns: 1,
    columnsCompact: 1,
    columnsGraph: 1,
    compact: true,
    graphHeight: 0,
    fontSize: 10,
  }
};

export const WideCompact: StoryObj<StoryArgs> = {
  args: {
    columns: 2,
    columnsCompact: 6,
    columnsGraph: 2,
    compact: true,
    graphHeight: 0,
    fontSize: 8,
  }
};