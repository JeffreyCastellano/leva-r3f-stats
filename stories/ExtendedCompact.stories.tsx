import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Cone } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  updateInterval: number;
  targetFramerate: number | null;
  showColors: boolean;
  defaultColor: string;
  showTriangles: boolean;
  vsync: boolean;
  meshCount: number;
  meshType: 'box' | 'sphere' | 'cone';
  order: number;
}

function RotatingMesh({ position, type }: { position: [number, number, number], type: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta;
      meshRef.current.rotation.z += delta * 0.3;
    }
  });

  const MeshComponent = type === 'sphere' ? Sphere : type === 'cone' ? Cone : Box;

  return (
    <MeshComponent ref={meshRef} args={[2, 2, 2]} position={position}>
      <meshStandardMaterial 
        color={`hsl(${Math.random() * 360}, 70%, 50%)`} 
        wireframe={Math.random() > 0.7}
      />
    </MeshComponent>
  );
}

function Scene({ args }: { args: StoryArgs }) {
  const { meshCount = 20, meshType = 'box', ...statsOptions } = args;
  useStatsPanel({ ...statsOptions, compact: true });

  // Create a grid of meshes
  const meshes: React.ReactElement[] = [];
  const gridSize = Math.ceil(Math.sqrt(meshCount));
  for (let i = 0; i < meshCount; i++) {
    const x = (i % gridSize) * 3 - (gridSize * 3) / 2;
    const z = Math.floor(i / gridSize) * 3 - (gridSize * 3) / 2;
    meshes.push(
      <RotatingMesh key={i} position={[x, 0, z]} type={meshType} />
    );
  }

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
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
        key="extended-compact-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Extended Compact',
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
    meshCount: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      description: 'Number of rotating meshes'
    },
    meshType: {
      control: { type: 'radio' },
      options: ['box', 'sphere', 'cone'],
      description: 'Type of mesh to render'
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
    showTriangles: true,
    vsync: true,
    meshCount: 10,
    meshType: 'box',
    order: -1
  }
};