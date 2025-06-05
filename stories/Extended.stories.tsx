import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  updateInterval: number;
  targetFramerate: number | null;
  showColors: boolean;
  defaultColor: string;
  showMinMax: boolean;
  showTriangles: boolean;
  vsync: boolean;
  meshCount: number;
  order: number;
}

function RotatingMesh({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[2, 2, 2]} position={position}>
      <meshStandardMaterial color="purple" />
    </Box>
  );
}

function Scene({ args }: { args: StoryArgs }) {
  const { meshCount = 10, ...statsOptions } = args;
  useStatsPanel(statsOptions);

  // Create a grid of meshes
  const meshes: JSX.Element[] = [];
  const gridSize = Math.ceil(Math.sqrt(meshCount));
  for (let i = 0; i < meshCount; i++) {
    const x = (i % gridSize) * 3 - (gridSize * 3) / 2;
    const z = Math.floor(i / gridSize) * 3 - (gridSize * 3) / 2;
    meshes.push(
      <RotatingMesh key={i} position={[x, 0, z]} />
    );
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {meshes}
      <OrbitControls />
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva 
        key="extended-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Extended',
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
    showTriangles: {
      control: 'boolean',
      description: 'Show triangle and draw call counts'
    },
    vsync: {
      control: 'boolean',
      description: 'Enable VSync detection'
    },
    meshCount: {
      control: { type: 'range', min: 1, max: 100, step: 1 },
      description: 'Number of rotating meshes'
    },
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel (lower numbers appear first)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExtendedOptions: Story = {
  args: {
    updateInterval: 100,
    targetFramerate: 144,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    showTriangles: true,
    vsync: true,
    meshCount: 10
  },
  render: (args) => <StoryComponent {...args} />
};

export const Default: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    showMinMax: true,
    showTriangles: true,
    vsync: true,
    meshCount: 10,
    order: -1
  }
};