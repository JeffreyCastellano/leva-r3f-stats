import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';

function Scene() {
  useStatsPanel({ compact: true });

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
  title: 'leva-r3f-stats/Compact',
  component: StoryComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompactMode: Story = {};