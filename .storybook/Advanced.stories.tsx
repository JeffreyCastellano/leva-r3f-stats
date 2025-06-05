import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

function RotatingMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[2, 2, 2]}>
      <meshStandardMaterial color="purple" />
    </Box>
  );
}

function Scene() {
  useStatsPanel({
    showTriangles: true,
    showMinMax: true,
    targetFramerate: 144,
    compact: false,
    showColors: true,
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {Array.from({ length: 10 }).map((_, i) => (
        <RotatingMesh key={i} />
      ))}
      <OrbitControls />
    </>
  );
}

function StoryComponent() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva />
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}

const meta: Meta = {
  title: 'leva-r3f-stats/Advanced',
  component: StoryComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdvancedOptions: Story = {};