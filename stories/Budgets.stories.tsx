import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cone, Torus } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  trianglesBudget: number;
  drawCallsBudget: number;
  meshCount: number;
  meshComplexity: 'low' | 'medium' | 'high';
  graphHeight: number;
  showFullLabels: boolean;
  showColors: boolean;
  columns: number;
  fontSize: number;
}

function ComplexMesh({ position, complexity }: { position: [number, number, number], complexity: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta;
    }
  });

  // Different complexity levels
  if (complexity === 'high') {
    return (
      <Torus ref={meshRef} args={[1, 0.4, 200, 200]} position={position}>
        <meshStandardMaterial color="#ff6b6b" wireframe />
      </Torus>
    );
  } else if (complexity === 'medium') {
    return (
      <Sphere ref={meshRef} args={[1, 32, 32]} position={position}>
        <meshStandardMaterial color="#6b6bff" />
      </Sphere>
    );
  } else {
    return (
      <Box ref={meshRef} args={[1.5, 1.5, 1.5]} position={position}>
        <meshStandardMaterial color="#6bff6b" />
      </Box>
    );
  }
}

function Scene({ args }: { args: StoryArgs }) {
  const { meshCount, meshComplexity, ...statsOptions } = args;
  
  useStatsPanel({
    ...statsOptions,
    stats: {
      fps: { show: true, order: 0 },
      ms: { show: true, order: 1 },
      triangles: { show: true, order: 2 },
      drawCalls: { show: true, order: 3 },
      gpu: { show: true, order: 4 },
      memory: { show: true },
      cpu: { show: false },
      compute: { show: false },
      vsync: { show: false }
    }
  });

  const meshes = [];
  const gridSize = Math.ceil(Math.sqrt(meshCount));
  const spacing = 3;
  
  for (let i = 0; i < meshCount; i++) {
    const x = (i % gridSize) * spacing - (gridSize * spacing) / 2;
    const z = Math.floor(i / gridSize) * spacing - (gridSize * spacing) / 2;
    
    meshes.push(
        // @ts-ignore
      <ComplexMesh 
        key={i} 
        position={[x, 0, z]} 
        complexity={meshComplexity}
      />
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
        key="budgets-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '5px',
        maxWidth: '400px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Budget System</h4>
        <p style={{ margin: '5px 0', fontSize: '11px', opacity: 0.8 }}>
          Budgets define performance targets. Stats turn yellow at 80% and red at 120% of budget.
        </p>
        <p style={{ margin: '5px 0', fontSize: '11px', opacity: 0.8 }}>
          Adjust mesh count and complexity to see how it affects the budget indicators.
        </p>
      </div>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Budgets',
  component: StoryComponent,
  argTypes: {
    trianglesBudget: {
      control: { type: 'range', min: 10000, max: 5000000, step: 10000 },
      description: 'Triangle budget for performance'
    },
    drawCallsBudget: {
      control: { type: 'range', min: 10, max: 5000, step: 10 },
      description: 'Draw call budget for performance'
    },
    meshCount: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      description: 'Number of meshes to render'
    },
    meshComplexity: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high'],
      description: 'Complexity of each mesh'
    },
    graphHeight: {
      control: { type: 'range', min: 0, max: 64, step: 8 },
      description: 'Graph height (0 for text mode)'
    },
    showFullLabels: {
      control: 'boolean',
      description: 'Show full labels with budget info in graph mode'
    },
    showColors: {
      control: 'boolean',
      description: 'Show performance-based colors'
    },
    columns: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'Number of columns'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LowBudget: Story = {
  args: {
    trianglesBudget: 50000,
    drawCallsBudget: 20,
    meshCount: 10,
    fontSize: 10,
    meshComplexity: 'medium',
    graphHeight: 24,
    showFullLabels: false,
    showColors: true,
    columns: 2,
  }
};

export const HighBudget: Story = {
  args: {
    trianglesBudget: 1000000,
    drawCallsBudget: 1000,
    meshCount: 25,
    fontSize: 10,
    meshComplexity: 'high',
    graphHeight: 24,
    showFullLabels: false,
    showColors: true,
    columns: 2,
  }
};

export const TextModeWithBudgets: Story = {
  args: {
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    meshCount: 15,
    fontSize: 10,
    meshComplexity: 'medium',
    graphHeight: 0,
    showFullLabels: false,
    showColors: true,
    columns: 2,
  }
};