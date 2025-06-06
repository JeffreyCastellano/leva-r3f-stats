import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Plane } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../../src';

function Scene() {
  useStatsPanel();

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Box position={[-2, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
      
      <Sphere position={[0, 0, 0]} args={[1, 32, 32]}>
        <meshStandardMaterial color="orange" metalness={0.5} roughness={0.2} />
      </Sphere>
      
      <Box position={[2, 0, 0]}>
        <meshStandardMaterial color="lightblue" />
      </Box>
      
      <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <meshStandardMaterial color="#cccccc" />
      </Plane>
      
      <OrbitControls />
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Leva />
      <Canvas camera={{ position: [5, 5, 5] }}>
        <Scene />
      </Canvas>
    </div>
  );
}