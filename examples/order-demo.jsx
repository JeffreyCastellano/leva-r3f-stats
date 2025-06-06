// examples/compact-demo.tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Torus, Box, Sphere } from '@react-three/drei';
import { useControls } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

function RotatingMeshes() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.5;
    }
  });
  
  return (
    <group ref={groupRef}>
      <Torus position={[-2, 0, 0]} args={[1, 0.4, 16, 50]}>
        <meshStandardMaterial color="#ff6b6b" />
      </Torus>
      <Box position={[0, 0, 0]}>
        <meshStandardMaterial color="#6b6bff" />
      </Box>
      <Sphere position={[2, 0, 0]} args={[0.8, 32, 32]}>
        <meshStandardMaterial color="#6bff6b" />
      </Sphere>
    </group>
  );
}

function Scene() {
  const { 
    compact, 
    fontSize, 
    columns,
    showColors,
    vsync
  } = useControls('Stats Options', {
    compact: { value: true },
    fontSize: { value: 10, min: 8, max: 16, step: 1 },
    columns: { value: 4, min: 1, max: 8, step: 1 },
    showColors: { value: true },
    vsync: { value: true }
  });

  useStatsPanel({ 
    compact,
    fontSize,
    columnsCompact: columns,
    showColors,
    vsync,
    updateInterval: 100
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <RotatingMeshes />
      <OrbitControls />
    </>
  );
}

export default function CompactDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [5, 5, 5] }}>
        <Scene />
      </Canvas>
    </div>
  );
}