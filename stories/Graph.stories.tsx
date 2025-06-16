import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  updateInterval: number;
  targetFramerate: number | null;
  showColors: boolean;
  defaultColor: string;
  graphHeight: number;
  graphHistory: number;
  vsync: boolean;
  order: number;
  meshCount: number;
  fontSize: number;
  showFPS: boolean;
  showMS: boolean;
  gpuPercentage: boolean;
  showMemory: boolean;
  showGPU: boolean;
  showCPU: boolean;
}

function AnimatedMesh({ position, speed = 1 }: { position: [number, number, number], speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.5;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * speed * 1.3) * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[1, 1, 1]} position={position}>
      <meshStandardMaterial color={`hsl(${position[0] * 30 + 180}, 70%, 50%)`} />
    </Box>
  );
}

function Scene({ args }: { args: StoryArgs }) {
  const {
    showFPS, showMS, showMemory, showGPU, showCPU,
    meshCount = 10,
    ...statsOptions
  } = args;

  useStatsPanel({
    ...statsOptions,
    stats: {
      fps: { show: showFPS },
      ms: { show: showMS },
      memory: { show: showMemory },
      gpu: { show: showGPU },
      cpu: { show: showCPU },
    }
  });

  const meshes: JSX.Element[] = [];
  const radius = 5;
  for (let i = 0; i < meshCount; i++) {
    const angle = (i / meshCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    meshes.push(
      <AnimatedMesh 
        key={i} 
        position={[x, 0, z]} 
        speed={1 + (i % 3) * 0.5}
      />
    );
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} color="#6b6bff" intensity={0.5} />
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
        key="graph-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Graph',
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
    graphHeight: {
      control: { type: 'range', min: 24, max: 96, step: 8 },
      description: 'Height of each graph'
    },
    graphHistory: {
      control: { type: 'range', min: 50, max: 200, step: 10 },
      description: 'Number of samples to show in graph'
    },
    vsync: {
      control: 'boolean',
      description: 'Enable VSync detection'
    },
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel'
    },
    meshCount: {
      control: { type: 'range', min: 1, max: 30, step: 1 },
      description: 'Number of animated meshes'
    },
    fontSize: {
      control: { type: 'range', min: 6, max: 16, step: 1 },
      description: 'Font size for stats display'
    },
    showFPS: { control: 'boolean', description: 'Show FPS graph' },
    showMS: { control: 'boolean', description: 'Show MS graph' },
    showMemory: { control: 'boolean', description: 'Show Memory graph' },
    showGPU: { control: 'boolean', description: 'Show GPU graph' },
    showCPU: { control: 'boolean', description: 'Show CPU graph' },
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
    graphHeight: 32,
    graphHistory: 100,
    vsync: true,
    order: -1,
    meshCount: 10,
    fontSize: 12,
    showFPS: true,
    showMS: true,
    showMemory: true,
    showGPU: true,
    showCPU: false,
  }
};

export const LargeGraphs: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    graphHeight: 48,
    graphHistory: 150,
    vsync: true,
    order: -1,
    meshCount: 15,
    fontSize: 12,
    showFPS: true,
    showMS: true,
    showMemory: false,
    gpuPercentage: false,
    showGPU: true,
    showCPU: false,
  }
};

export const MinimalGraphs: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    graphHeight: 24,
    graphHistory: 80,
    vsync: true,
    order: -1,
    meshCount: 5,
    fontSize: 10,
    showFPS: true,
    showMS: true,
    showMemory: false,
    gpuPercentage: false,
    showGPU: false,
    showCPU: false,
  }
};