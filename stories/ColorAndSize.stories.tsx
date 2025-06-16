import React, { useRef, useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Torus, Text } from '@react-three/drei';
import { Leva } from 'leva';
import { useStatsPanel } from '../src';
import * as THREE from 'three';

interface StoryArgs {
  showColors: boolean;
  defaultColor: string;
  fontSize: number;
  compact: boolean;
  graphHeight: number;
  gpuPercentage: boolean;
  graphBackgroundColor: string;
  graphGridColor: string;
  showMinMax: boolean;
  showFullLabels: boolean;
  targetFramerate: number | null;
  trianglesBudget: number;
  drawCallsBudget: number;
  showDrawCalls: boolean;
  simulateLoad: 'none' | 'light' | 'medium' | 'heavy';
  columns: number;
  columnsCompact: number;
}

// Component to simulate different performance loads
function PerformanceSimulator({ load }: { load: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [meshCount, setMeshCount] = useState(1);

  useEffect(() => {
    switch (load) {
      case 'light':
        setMeshCount(5);
        break;
      case 'medium':
        setMeshCount(15);
        break;
      case 'heavy':
        setMeshCount(30);
        break;
      default:
        setMeshCount(1);
    }
  }, [load]);

  useFrame((state) => {
    if (groupRef.current && load !== 'none') {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      
      // Add computational load
      if (load === 'heavy') {
        // Simulate heavy computation
        const start = performance.now();
        while (performance.now() - start < 5) {
          Math.sqrt(Math.random());
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: meshCount }).map((_, i) => {
        const angle = (i / meshCount) * Math.PI * 2;
        const radius = 3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        if (i % 3 === 0) {
          return (
            <Box key={i} position={[x, 0, z]} args={[1, 1, 1]}>
              <meshStandardMaterial color="#ff6b6b" />
            </Box>
          );
        } else if (i % 3 === 1) {
          return (
            <Sphere key={i} position={[x, 0, z]} args={[0.6, 32, 16]}>
              <meshStandardMaterial color="#6b6bff" />
            </Sphere>
          );
        } else {
          return (
            <Torus key={i} position={[x, 0, z]} args={[0.6, 0.3, 16, 32]}>
              <meshStandardMaterial color="#6bff6b" />
            </Torus>
          );
        }
      })}
    </group>
  );
}

function Scene({ args }: { args: StoryArgs }) {
  const { simulateLoad, ...statsOptions } = args;
  
  useStatsPanel({
    ...statsOptions,
    stats: {
      fps: { show: true, order: 0 },
      ms: { show: true, order: 1 },
      memory: { show: true, order: 2 },
      gpu: { show: true, order: 3 },
      cpu: { show: true, order: 4 },
      triangles: { show: true, order: 5 },
      drawCalls: { show: statsOptions.showDrawCalls, order: 6 },
      compute: { show: false },
      vsync: { show: false }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} color="#6b6bff" intensity={0.5} />
      
      <PerformanceSimulator load={simulateLoad} />
      
      {/* Central decoration */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color={statsOptions.defaultColor}
        anchorX="center"
        anchorY="middle"
      >
        Performance: {simulateLoad}
      </Text>
      
      <OrbitControls />
    </>
  );
}

function StoryComponent(args: StoryArgs) {
  const sceneKey = JSON.stringify(args);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Leva 
        key="colors-fonts-story"
        oneLineLabels={false}
      />
      <Canvas>
        <Scene key={sceneKey} args={args} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '8px',
        maxWidth: '450px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Color & Font System</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '5px 0', fontSize: '11px' }}>
            <strong>Performance Colors:</strong> {args.showColors ? 'Enabled' : 'Disabled'}
          </p>
          {args.showColors ? (
            <>
              <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                <span style={{ color: '#51cf66' }}>● Good</span>
                <span style={{ color: '#ffd93d' }}>● Warning</span>
                <span style={{ color: '#ff6b6b' }}>● Critical</span>
              </div>
              <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.8 }}>
                FPS: Green {'>'} {Math.round(args.targetFramerate! * 0.8)} | Yellow {'>'} {Math.round(args.targetFramerate! * 0.5)} | Red
              </p>
              <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.8 }}>
                MS/GPU: Green {'<'} {((1000 / args.targetFramerate!) * 1.2).toFixed(1)} | Yellow {'<'} {((1000 / args.targetFramerate!) * 1.5).toFixed(1)} | Red
              </p>
              <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.8 }}>
                Triangles: Green {'<'} {Math.round(args.trianglesBudget * 0.8)} | Yellow {'<'} {Math.round(args.trianglesBudget * 1.2)} | Red
              </p>
            </>
          ) : (
            <p style={{ margin: '5px 0', fontSize: '11px', opacity: 0.8 }}>
              All stats use default color: <span style={{ color: args.defaultColor }}>{args.defaultColor}</span>
            </p>
          )}
        </div>
        
        {args.graphHeight > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '5px 0', fontSize: '11px' }}>
              <strong>Graph Colors:</strong>
            </p>
            <div style={{ display: 'flex', gap: '15px', margin: '10px 0', fontSize: '10px' }}>
              <div>
                Background: <span style={{ 
                  backgroundColor: args.graphBackgroundColor,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: '1px solid #444'
                }}>{args.graphBackgroundColor}</span>
              </div>
              <div>
                Grid: <span style={{ 
                  backgroundColor: args.graphGridColor,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: '1px solid #444'
                }}>{args.graphGridColor}</span>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <p style={{ margin: '5px 0', fontSize: '11px' }}>
            <strong>Font Size:</strong> {args.fontSize}px
          </p>
          <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.8 }}>
            {args.compact ? 'Compact mode uses inline layout' : 
             args.graphHeight > 0 ? 'Graph mode shows value overlays' : 
             'Normal mode shows labels and values'}
          </p>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'leva-r3f-stats/Colors and Font Sizes',
  component: StoryComponent,
  argTypes: {
    showColors: {
      control: 'boolean',
      description: 'Enable performance-based colors'
    },
    defaultColor: {
      control: 'color',
      description: 'Default color when showColors is false'
    },
    fontSize: {
      control: { type: 'range', min: 6, max: 18, step: 1 },
      description: 'Font size for stats text'
    },
    compact: {
      control: 'boolean',
      description: 'Use compact display mode'
    },
    graphHeight: {
      control: { type: 'range', min: 0, max: 64, step: 8 },
      description: 'Graph height (0 for text mode)'
    },
    graphBackgroundColor: {
      control: 'color',
      description: 'Background color for graphs'
    },
    graphGridColor: {
      control: 'color',
      description: 'Grid line color for graphs'
    },
    showMinMax: {
      control: 'boolean',
      description: 'Show min/max values in text mode'
    },
    showFullLabels: {
      control: 'boolean',
      description: 'Show full labels with extra info in graph mode'
    },
    targetFramerate: {
      control: { type: 'select' },
      options: [null, 30, 60, 90, 120, 144],
      description: 'Target FPS for color thresholds'
    },
    trianglesBudget: {
      control: { type: 'range', min: 10000, max: 500000, step: 10000 },
      description: 'Triangle budget for color thresholds'
    },
    drawCallsBudget: {
      control: { type: 'range', min: 10, max: 500, step: 10 },
      description: 'Draw call budget for color thresholds'
    },
    simulateLoad: {
      control: { type: 'select' },
      options: ['none', 'light', 'medium', 'heavy'],
      description: 'Simulate different performance loads'
    },
    columns: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'Number of columns in normal/graph mode'
    },
    columnsCompact: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Number of columns in compact mode'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PerformanceColors: Story = {
  name: 'Performance Colors',
  args: {
    showColors: true,
    defaultColor: '#999999',
    fontSize: 12,
    compact: false,
    graphHeight: 0,
    gpuPercentage: false,
    graphBackgroundColor: '#181c20',
    graphGridColor: '#333',
    showMinMax: true,
    showFullLabels: false,
    targetFramerate: 60,
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    simulateLoad: 'none',
    columns: 2,
    columnsCompact: 4,
  }
};

export const CustomDefaultColor: Story = {
  name: 'Custom Default Color',
  args: {
    showColors: false,
    defaultColor: '#00ff88',
    fontSize: 14,
    compact: false,
    graphHeight: 0,
    gpuPercentage: false,
    graphBackgroundColor: '#181c20',
    graphGridColor: '#333',
    showMinMax: true,
    showFullLabels: false,
    targetFramerate: 60,
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    simulateLoad: 'light',
    columns: 2,
    columnsCompact: 4,
  }
};

export const CustomGraphColors: Story = {
  name: 'Custom Graph Colors',
  args: {
    showColors: true,
    defaultColor: '#9994ff',
    fontSize: 11,
    compact: false,
    graphHeight: 40,
    gpuPercentage: false,
    graphBackgroundColor: '#392a44',
    graphGridColor: '#443351',
    showMinMax: false,
    showFullLabels: true,
    targetFramerate: 60,
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    simulateLoad: 'light',
    columns: 2,
    columnsCompact: 4,
  }
};

export const DarkThemeGraphs: Story = {
  name: 'Dark Theme Graphs',
  args: {
    showColors: true,
    defaultColor: '#999999',
    fontSize: 10,
    compact: false,
    graphHeight: 48,
    gpuPercentage: false,
    graphBackgroundColor: '#00000040',
    graphGridColor: '#00000050',
    showMinMax: false,
    showFullLabels: false,
    targetFramerate: 120,
    trianglesBudget: 200000,
    drawCallsBudget: 200,
    simulateLoad: 'medium',
    columns: 3,
    columnsCompact: 4,
  }
};

export const LightThemeGraphs: Story = {
  name: 'Light Theme Graphs',
  args: {
    showColors: false,
    defaultColor: '#333333',
    fontSize: 12,
    compact: false,
    graphHeight: 36,
    gpuPercentage: false,
    graphBackgroundColor: '#f5f5f5',
    graphGridColor: '#ddd',
    showMinMax: false,
    showFullLabels: true,
    targetFramerate: 60,
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    simulateLoad: 'light',
    columns: 2,
    columnsCompact: 4,
  }
};

export const SmallCompactText: Story = {
  name: 'Small Compact Text',
  args: {
    showColors: true,
    defaultColor: '#999999',
    fontSize: 7,
    compact: true,
    graphHeight: 0,
    gpuPercentage: false,
    graphBackgroundColor: '#181c20',
    graphGridColor: '#333',
    showMinMax: false,
    showDrawCalls: false,
    showFullLabels: false,
    targetFramerate: 60,
    trianglesBudget: 50000,
    drawCallsBudget: 50,
    simulateLoad: 'medium',
    columns: 2,
    columnsCompact: 5,
  }
};

export const LargeFontGraphs: Story = {
  name: 'Large Font Graphs',
  args: {
    showColors: true,
    defaultColor: '#999999',
    fontSize: 16,
    compact: false,
    graphHeight: 48,
    gpuPercentage: false,
    graphBackgroundColor: '#1a1a1a',
    graphGridColor: '#444',
    showMinMax: false,
    showFullLabels: true,
    targetFramerate: 120,
    trianglesBudget: 200000,
    drawCallsBudget: 200,
    simulateLoad: 'light',
    columns: 3,
    columnsCompact: 4,
  }
};

export const MonochromeStyle: Story = {
  name: 'Monochrome Style',
  args: {
    showColors: false,
    defaultColor: '#ffffff',
    fontSize: 11,
    compact: false,
    graphHeight: 32,
    graphBackgroundColor: '#000000',
    graphGridColor: '#333',
    showMinMax: false,
    showFullLabels: false,
    targetFramerate: 60,
    trianglesBudget: 100000,
    drawCallsBudget: 100,
    simulateLoad: 'light',
    columns: 2,
    columnsCompact: 4,
  }
};