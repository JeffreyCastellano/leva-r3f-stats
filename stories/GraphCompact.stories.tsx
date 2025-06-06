import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Torus, TorusKnot } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  updateInterval: number;
  targetFramerate: number | null;
  showColors: boolean;
  defaultColor: string;
  graphHeight: number;
  trackCompute: boolean;
  order: number;
  fontSize: number;
}

function ComplexMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <TorusKnot ref={meshRef} args={[10, 3, 128, 32]}>
      <meshStandardMaterial color="#6b6bff" metalness={0.5} roughness={0.2} />
    </TorusKnot>
  );
}

function Scene({ args }: { args: StoryArgs }) {
  useStatsPanel({ 
    ...args,
    compact: true,
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <ComplexMesh />
      <OrbitControls />
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva 
        key="graph-compact-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Graph Compact',
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
      description: 'Show performance-based colors in compact display'
    },
    defaultColor: {
      control: 'color',
      description: 'Default text color when showColors is false'
    },
    graphHeight: {
      control: { type: 'range', min: 16, max: 48, step: 4 },
      description: 'Height of graphs (minimum 16px)'
    },
    trackCompute: {
      control: 'boolean',
      description: 'Track WebGPU compute (if available)'
    },
    order: {
      control: { type: 'range', min: -10, max: 10, step: 1 },
      description: 'Display order in Leva panel'
    },
    fontSize: {
      control: { type: 'range', min: 8, max: 16, step: 1 },
      description: 'Font size for stats display'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MicroGraphs: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    graphHeight: 24,
    trackCompute: false,
    order: -1,
    fontSize: 9,
  }
};

export const CompactGraphs: StoryObj<StoryArgs> = {
  args: {
    updateInterval: 100,
    targetFramerate: null,
    showColors: true,
    defaultColor: '#999999',
    graphHeight: 32,
    trackCompute: false,
    order: -1,
    fontSize: 11,
  }
};