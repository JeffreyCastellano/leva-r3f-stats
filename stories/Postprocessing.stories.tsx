import React, { useEffect, useRef, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Box, 
  Sphere, 
  Torus,
  Effects,
  Html
} from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
extend({ UnrealBloomPass, SSAOPass });

interface StoryArgs {
  postprocessingType: 'threejs' | 'custom';
  aggressiveCount: boolean;
  updateInterval: number;
  meshCount: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;
  showDrawCalls: boolean;
  showTriangles: boolean;
  showFPS: boolean;
  showMS: boolean;
  showGPU: boolean;
  graphHeight: number;
}

function AnimatedMesh({ position, type = 'box' }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = 1 + Math.random() * 0.5;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.5;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.5;
    }
  });

  const color = `hsl(${position[0] * 30 + 180}, 70%, 50%)`;

  switch (type) {
    case 'sphere':
      return (
        <Sphere ref={meshRef} args={[0.5, 32, 16]} position={position}>
          <meshStandardMaterial color={color} />
        </Sphere>
      );
    case 'torus':
      return (
        <Torus ref={meshRef} args={[0.5, 0.2, 16, 32]} position={position}>
          <meshStandardMaterial color={color} />
        </Torus>
      );
    default:
      return (
        <Box ref={meshRef} args={[1, 1, 1]} position={position}>
          <meshStandardMaterial color={color} />
        </Box>
      );
  }
}

function CustomPostprocessing() {
    const { gl, scene, camera, size } = useThree();
    const renderTarget = useRef<THREE.WebGLRenderTarget>();
    
    useEffect(() => {
      renderTarget.current = new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
      
      return () => {
        renderTarget.current?.dispose();
      };
    }, [size]);
    
    useFrame((state) => {
      if (!renderTarget.current) return;
      
      const originalRenderTarget = gl.getRenderTarget();
      
      gl.setRenderTarget(null);
      gl.clear();
      gl.render(scene, camera);
      
      gl.setRenderTarget(renderTarget.current);
      gl.clear();
      gl.render(scene, camera);
      
      gl.setRenderTarget(null);
      
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
          map: renderTarget.current.texture,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        })
      );
      
      const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quadScene = new THREE.Scene();
      quadScene.add(quad);
      
      quad.position.x = Math.sin(state.clock.elapsedTime) * 0.02;
      quad.position.y = Math.cos(state.clock.elapsedTime) * 0.02;
      
      gl.render(quadScene, orthoCamera);
      
      quad.geometry.dispose();
      (quad.material as THREE.MeshBasicMaterial).dispose();
      
      gl.setRenderTarget(originalRenderTarget);
    }, 1);
    
    return (
      <Html position={[0, 3, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          whiteSpace: 'nowrap'
        }}>
          Multi-Pass Echo Effect Active
        </div>
      </Html>
    );
  }

function Scene({ args }: { args: StoryArgs }) {
  const { 
    postprocessingType,
    aggressiveCount,
    meshCount,
    bloomIntensity,
    bloomThreshold,
    bloomRadius,
    showDrawCalls,
    showTriangles,
    showFPS,
    showMS,
    showGPU,
    ...statsOptions 
  } = args;

  useStatsPanel({
    ...statsOptions,
    aggressiveCount,
    stats: {
      fps: { show: showFPS, order: 0 },
      ms: { show: showMS, order: 1 },
      gpu: { show: showGPU, order: 2 },
      drawCalls: { show: showDrawCalls, order: 3 },
      triangles: { show: showTriangles, order: 4 },
      memory: { show: true, order: 5 },
      cpu: { show: false },
      compute: { show: false },
      vsync: { show: false }
    },
    showMinMax: true,
    compact: false
  });

  const meshes = useMemo(() => {
    const result = [];
    const gridSize = Math.ceil(Math.sqrt(meshCount));
    const spacing = 2;
    
    for (let i = 0; i < meshCount; i++) {
      const x = (i % gridSize) * spacing - (gridSize * spacing) / 2;
      const z = Math.floor(i / gridSize) * spacing - (gridSize * spacing) / 2;
      const type = ['box', 'sphere', 'torus'][i % 3];
      
      result.push(
        // @ts-ignore
        <AnimatedMesh 
          key={i} 
          position={[x, 0, z]} 
          type={type}
        />
      );
    }
    
    return result;
  }, [meshCount]);

  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 10, -10]} color="#6b6bff" intensity={0.5} />
      
      {meshes}
      
      <OrbitControls makeDefault />
      
      {postprocessingType === 'threejs' && (
        <Effects disableGamma>
          {/* @ts-ignore */}
          <unrealBloomPass 
            args={[undefined, bloomIntensity, bloomRadius, bloomThreshold]}
          />
        </Effects>
      )}
      
      {postprocessingType === 'custom' && (
        <CustomPostprocessing />
      )}
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva 
        key="postprocessing-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
      
      {/* Info panel */}
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
        <h4 style={{ margin: '0 0 10px 0' }}>Postprocessing Info</h4>
        <p style={{ margin: '5px 0' }}>
          <strong>Type:</strong> {
            args.postprocessingType === 'threejs' ? 'Three.js (via drei)' : 
            'Custom Multi-pass'
          }
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Aggressive Count:</strong> {args.aggressiveCount ? 'ON' : 'OFF'}
        </p>
        <p style={{ margin: '10px 0 5px 0', fontSize: '11px', opacity: 0.8 }}>
          {args.aggressiveCount 
            ? '✓ Using peak value tracking - shows scene-only counts'
            : '⚠ Normal mode - includes postprocessing draw calls'}
        </p>
        <p style={{ margin: '5px 0', fontSize: '11px', opacity: 0.8 }}>
          Each postprocessing pass adds draw calls and triangles
        </p>
      </div>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Postprocessing',
  component: StoryComponent,
  argTypes: {
    postprocessingType: {
      control: { type: 'select' },
      options: ['threejs', 'custom'],
      description: 'Type of postprocessing to use'
    },
    aggressiveCount: {
      control: 'boolean',
      description: 'Use peak value tracking for accurate scene counts'
    },
    updateInterval: {
      control: { type: 'range', min: 50, max: 500, step: 50 },
      description: 'How often to update stats (ms)'
    },
    meshCount: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      description: 'Number of meshes in scene'
    },
    bloomIntensity: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Bloom effect intensity'
    },
    bloomThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Bloom luminance threshold'
    },
    bloomRadius: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Bloom radius'
    },
    graphHeight: {
      control: { type: 'range', min: 0, max: 96, step: 8 },
      description: 'Height of graphs (0 = text only)'
    },
    showDrawCalls: { control: 'boolean' },
    showTriangles: { control: 'boolean' },
    showFPS: { control: 'boolean' },
    showMS: { control: 'boolean' },
    showGPU: { control: 'boolean' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeJSPostprocessing: Story = {
  args: {
    postprocessingType: 'threejs',
    aggressiveCount: true,
    updateInterval: 100,
    meshCount: 12,
    bloomIntensity: 20,
    bloomThreshold: 0,
    bloomRadius: 0.85,
    graphHeight: 48,
    showDrawCalls: true,
    showTriangles: true,
    showFPS: true,
    showMS: true,
    showGPU: true,
  }
};

export const CustomMultiPass: Story = {
  args: {
    postprocessingType: 'custom',
    aggressiveCount: true,
    updateInterval: 100,
    meshCount: 12,
    bloomIntensity: 50,
    bloomThreshold: 0,
    bloomRadius: 0.85,
    graphHeight: 48,
    showDrawCalls: true,
    showTriangles: true,
    showFPS: true,
    showMS: true,
    showGPU: true,
  }
};