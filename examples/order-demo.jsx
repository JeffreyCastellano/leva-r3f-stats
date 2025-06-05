import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { useControls } from 'leva';
import { useStatsPanel } from '../src';

function Scene() {
  // Stats panel appears at TOP by default (order: -1)
  useStatsPanel({ 
    compact: true 
  });

  // Scene controls appear second (order: 0)
  const { rotationSpeed, meshColor } = useControls('Scene Controls', {
    rotationSpeed: { value: 0.01, min: 0, max: 0.1, step: 0.001 },
    meshColor: { value: '#ff6b6b' }
  }, { order: 0 });

  // Lighting controls appear third (order: 1)
  const { lightIntensity } = useControls('Lighting', {
    lightIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 }
  }, { order: 1 });

  return (
    <>
      <ambientLight intensity={lightIntensity * 0.5} />
      <pointLight position={[10, 10, 10]} intensity={lightIntensity} />
      
      <Box position={[0, 0, 0]} rotation={[0, Date.now() * rotationSpeed * 0.001, 0]}>
        <meshStandardMaterial color={meshColor} />
      </Box>
      
      <OrbitControls />
    </>
  );
}

export default function OrderDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3] }}>
        <Scene />
      </Canvas>
    </div>
  );
} 