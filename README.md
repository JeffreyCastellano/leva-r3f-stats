# leva-r3f-stats
A small Leva plugin to efficiently display React Three Fiber stats

[![npm version](https://img.shields.io/npm/v/leva-r3f-stats.svg)](https://www.npmjs.com/package/leva-r3f-stats)
[![storybook](https://img.shields.io/badge/storybook-live-ff4785.svg)](https://JeffreyCastellano.github.io/leva-r3f-stats)

![Big Header](examples/img/hero.gif)

[**Live Demo**](https://JeffreyCastellano.github.io/leva-r3f-stats)

## Features

### 📊 Real-time Performance Metrics
- **FPS (Frames Per Second)** - Color-coded performance indicators with automatic threshold detection
- **Frame Time (MS)** - Monitor render performance with target-based warnings
- **Memory Usage** - Track heap memory consumption with automatic unit formatting (MB/GB)
- **GPU Time** - WebGL2 timer queries for accurate GPU measurements
- **CPU Time** - Frame processing time estimation, requires GPU measurement
- **Triangle & Draw Calls** - Monitor scene complexity and rendering efficiency

### 🎯 Smart Target Detection
- **Automatic Refresh Rate Detection** - Detects display refresh rates from 30Hz to 360Hz
- **VSync Detection** - Real-time detection with pattern matching
- **Custom Performance Thresholds** - Set your own warning and critical levels
- **High Refresh Rate Support** - Optimized for high speed monitors (144Hz, 240Hz, etc.)

### 📈 Multiple Display Modes
- **Regular Mode** - Detailed grid view with labels and min/max values
- **Compact Mode** - Single-line display for minimal UI footprint
- **Graph Mode** - Real-time performance graphs with customizable height
- **Flexible Columns** - Configure column count for each display mode

### 🎨 Customization Options
- **Individual Stat Control** - Toggle and reorder any metric
- **Font Size Control** - Adjustable text size for all display modes
- **Color Themes** - Full control over warning colors and themes
- **Folder Organization** - Group stats in collapsible Leva folders

### ⚡ Performance Optimized
- **WebGL2 GPU Timing** - Direct GPU measurement via timer queries
- **WebGPU Support** - Experimental compute shader timing
- **Efficient Data Structures** - Ring buffers for minimal memory overhead
- **Configurable Update Rates** - Balance accuracy vs performance


## Storybook Examples

### Display Modes
- [Basic Example](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-basic--default) - Simple setup with default configuration
- [Compact Mode](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-compact--default) - Single-line display with adjustable font sizes
- [Graph Mode](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-graph--default) - Real-time performance graphs
- [Graph Compact](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-graph-compact--micro-graphs) - Minimal graphs with compact display

### Advanced Features
- [Extended Stats](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-extended--default) - All metrics including triangles and draw calls
- [Extended Compact](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-extended-compact--reordered-stats) - Complex scenes with custom stat ordering
- [Minimal Graphs](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-graph--minimal-graphs) - Compact graph display
- [Columns](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-columns--three-column-layout) - Balanced grid display
- [WebGPU Experiment](https://lhgjxs.csb.app/) - (https://codesandbox.io/p/sandbox/lhgjxs) External experimental WebGPU Compute Example

### Customization
- [Colors and Font Sizes](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-colors-and-font-sizes--performance-colors) - Color themes and font customization
- [Column Layouts](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-columns--custom-columns) - Flexible column configurations
- [Performance Budgets](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-budgets--low-budget) - Triangle and draw call budgets with visual warnings
- [Postprocessing](https://JeffreyCastellano.github.io/leva-r3f-stats/?path=/story/leva-r3f-stats-postprocessing--three-js-postprocessing) - Accurate counts with multi-pass rendering

## Installation

```bash
npm install leva-r3f-stats
# or
yarn add leva-r3f-stats
# or
pnpm add leva-r3f-stats
# or
bun install leva-r3f-stats
```

## Quick Start

```jsx
import { Canvas } from '@react-three/fiber';
import { useStatsPanel } from 'leva-r3f-stats';

function Scene() {
  useStatsPanel(); // That's it!
  
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}

function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
```

## Options

```jsx
useStatsPanel({
  // Update interval in milliseconds (default: 100)
  updateInterval: 100,
  
  // Target framerate - null for auto-detect (default: null)
  targetFramerate: null,
  
  // Display mode options
  compact: false,              // Compact single-line display (default: false)
  graphHeight: 0,             // Graph height in pixels, 0 for text mode (default: 0)
  graphHistory: 100,          // Number of samples in graph (default: 100)
  
  // Column configuration
  columns: 2,                 // Default columns for regular mode
  columnsCompact: 4,          // Columns in compact mode (default: 4)
  
  // Styling options
  showColors: true,           // Show performance-based colors (default: true)
  defaultColor: '#999999',    // Default text color (default: '#999999')
  fontSize: 12,               // Font size in pixels (default: 12)
  showMinMax: true,           // Show min/max values (default: true)
  
  // Feature toggles
  trackCompute: false,        // Track WebGPU compute (experimental) (default: false)
  vsync: true,                // Enable VSync detection (default: true)
  aggressiveCount: false,     // Accumulates triangles/draw calls across render passes (default: false)

    // Graph customization
  graphBackgroundColor: '#181c20',  // Background color for graphs (default: '#181c20')
  graphGridColor: '#333',           // Grid line color for graphs (default: '#333')
  showFullLabels: false,            // Show full labels with extra info in graph mode (default: false)
  
  // Performance budgets
  trianglesBudget: 1000000,         // Triangle budget for warnings (default: 1000000)
  drawCallsBudget: 1000,            // Draw call budget for warnings (default: 1000)
  // Leva integration
  order: -1,                 // Display order in Leva panel (default: -1)
  folder: null,              // Folder name or config (default: null)
  
  // Individual stat configuration
  stats: {
    fps:       { show: true, order: 0 },
    ms:        { show: true, order: 1 },
    memory:    { show: true, order: 2 },
    gpu:       { show: true, order: 3 },
    cpu:       { show: true, order: 4 },
    compute:   { show: true, order: 5 },
    triangles: { show: true, order: 6 },
    drawCalls: { show: true, order: 7 },
    vsync:     { show: true, order: 8 }
  }
});
```

## Target Framerate Configuration

The panel supports both automatic and manual target framerate settings:

```jsx
// Auto-detect based on display refresh rate and vsync
useStatsPanel({ 
  targetFramerate: null  // Default - auto-detects 60Hz, 120Hz, 144Hz, etc.
});

// Set a specific target
useStatsPanel({ targetFramerate: 60 });   // Standard target  
useStatsPanel({ targetFramerate: 120 });  // High refresh target
useStatsPanel({ targetFramerate: 240 });  // Competitive gaming
```

The target framerate affects:
- Color coding thresholds (green/yellow/red)
- Performance warnings
- Labels showing "FPS (target: X)" and "MS (target: X)"
- Automatic adjustment of warning/critical thresholds

## Display Modes

### Regular Mode
Shows detailed statistics in a grid layout with labels and min/max values.

![Normal Stats Mode](examples/img/expanded.jpg)
```jsx
useStatsPanel({ 
  compact: false,
  columns: 2,      // 2-column grid
  fontSize: 12     // Standard font size
});
```

### Compact Mode
Shows essential metrics in a minimal UI footprint.

![Compact Stats Mode](examples/img/compact.jpg)

```jsx
useStatsPanel({ 
  compact: true,
  columnsCompact: 4,  // 4 stats per row
  fontSize: 10        // Smaller text
});
```

### Graph Mode
Real-time performance graphs for visual monitoring.

![Graph Stats Mode](examples/img/graph.jpg)

```jsx
useStatsPanel({ 
  graphHeight: 48,    // 48px tall graphs
  graphHistory: 150   // Show last 150 samples
});
```


## Performance Thresholds

The panel automatically color-codes metrics based on performance:

- 🟢 **Green**: Good performance (FPS ≥ 80% of target)
- 🟡 **Yellow**: Warning (FPS 50-80% of target)
- 🔴 **Red**: Critical (FPS < 50% of target)

Example thresholds for 60 FPS target:
- Green: 48+ FPS (80% of 60)
- Yellow: 30-48 FPS (50-80% of 60)
- Red: <30 FPS (below 50% of 60)

## Advanced Usage

### Custom Stat Configuration
Control visibility and order of individual stats:

```jsx
useStatsPanel({
  stats: {
    fps: { show: true, order: 0 },      // Show first
    ms: { show: true, order: 1 },       // Show second
    memory: { show: false },            // Hide memory
    gpu: { show: true, order: 2 },      // Show third
    cpu: { show: false },               // Hide CPU
    triangles: { show: true, order: 3 }, // Show fourth
    drawCalls: { show: true, order: 4 }, // Show fifth
    vsync: { show: true, order: 5 }     // Show last
  }
});
```

### Folder Organization
Group stats in a Leva folder:

```jsx
// Simple folder
useStatsPanel({
  folder: 'Performance'
});

// Folder with options
useStatsPanel({
  folder: {
    name: 'Performance',
    collapsed: false  // Start expanded
  }
});
```

### Column Layouts
Different column counts for different modes:

```jsx
useStatsPanel({
  columns: 3,         // 3 columns in regular mode
  columnsCompact: 6,  // 6 columns in compact mode
});
```

### Font Size Control
Adjust text size for better readability:

```jsx
// Compact display with tiny text
useStatsPanel({
  compact: true,
  fontSize: 8
});

// Regular display with large text
useStatsPanel({
  compact: false,
  fontSize: 14
});

// Graph mode with standard text
useStatsPanel({
  graphHeight: 32,
  fontSize: 11
});
```

### Graph Customization
Customize the appearance and behavior of graph mode:

```jsx
// Graph sizing
useStatsPanel({
  graphHeight: 48,              // Height of each graph in pixels
  graphHistory: 150,            // Number of samples to display
  columns: 3,                   // Number of graphs per row
});

// Graph colors
useStatsPanel({
  graphHeight: 40,
  graphBackgroundColor: '#1a1a1a',  // Dark background
  graphGridColor: '#444',           // Light grid lines
  showColors: true                  // Performance-based text colors
});

// Full labels in graph mode
useStatsPanel({
  graphHeight: 32,
  showFullLabels: true,  // Shows extra info like targets and peaks
});
```

With showFullLabels: true, graphs display additional context:
```jsx
FPS: "FPS (target: 60)"
MS: "MS (target: 16.7)"
Triangles: "TRI (peak: 1.2M)"
Draw Calls: "DRW (peak: 156)"
```

### Performance Budgets
Set performance budgets to get visual warnings when limits are exceeded:

```jsx
// Standard desktop performance budget
useStatsPanel({
  trianglesBudget: 1000000,  // 1M triangles
  drawCallsBudget: 1000,     // 1k draw calls
});

// Mobile/low-end budget
useStatsPanel({
  trianglesBudget: 100000,   // 100k triangles
  drawCallsBudget: 100,      // 100 draw calls
});

// High-end desktop budget
useStatsPanel({
  trianglesBudget: 5000000,  // 5M triangles
  drawCallsBudget: 5000,     // 5k draw calls
});
```


### Control Display Order
```jsx
// Stats panel appears at top by default (order: -1)
useStatsPanel(); 

// Custom order to control position
useStatsPanel({
  order: 5  // Lower numbers appear first
});

// Use with other Leva controls
const { speed } = useControls('Animation', {
  speed: { value: 1, min: 0, max: 5 }
}, { order: 0 }); // Appears after stats
```

### Performance Monitoring in Production
```jsx
// Optimized for production
useStatsPanel({
  updateInterval: 500,    // Update every 500ms
  compact: true,          // Use compact mode
  showMinMax: false,      // Disable min/max tracking
  fontSize: 9,            // Smaller text
  columnsCompact: 6       // More items per row
});
```

### WebGPU Compute Tracking
```jsx
// Enable experimental WebGPU compute timing
useStatsPanel({
  trackCompute: true,
  stats: {
    compute: { show: true, order: 5 }
  }
});
```

### Dynamic Configuration
```jsx
function Scene() {
  const isDev = process.env.NODE_ENV === 'development';
  
  useStatsPanel({
    // Different settings for dev vs prod
    updateInterval: isDev ? 100 : 500,
    compact: !isDev,
    showMinMax: isDev,
    graphHeight: isDev ? 32 : 0,
    fontSize: isDev ? 12 : 10,
    
    // Show more stats in development
    stats: {
      fps: { show: true },
      ms: { show: true },
      memory: { show: isDev },
      gpu: { show: true },
      cpu: { show: isDev },
      triangles: { show: isDev },
      drawCalls: { show: isDev }
    }
  });
}
```

## Metrics Explained

### Core Metrics

| Metric | Description | Good Values | Notes |
|--------|-------------|-------------|--------|
| **FPS** | Frames per second | Match display refresh rate | Color-coded based on target |
| **MS** | Frame render time | <16.67ms (60fps), <8.33ms (120fps) | Lower is better |
| **Memory** | JS heap usage | Depends on app | Chrome/Edge only |
| **GPU** | GPU processing time | <16.67ms (60fps) | WebGL2 timer queries |
| **CPU** | CPU processing time | <16.67ms (60fps) | Estimated from frame timing |

### Extended Metrics

| Metric | Description | When to Enable | Impact |
|--------|-------------|----------------|---------|
| **Compute** | WebGPU compute time | Using WebGPU | Requires `trackCompute: true` |
| **Triangles** | Triangle count | Complex scenes | Always available |
| **Draw Calls** | Number of draw calls | Optimization | Lower is better |
| **VSync** | Display refresh rate | Always useful | Auto-detected |

### Understanding the Values

**FPS (Frames Per Second)**
- Measures how many frames are rendered per second
- Higher is better, should match your display refresh rate
- Shows "FPS (target: X)" with your configured target

**MS (Milliseconds per Frame)**
- Time taken to render one frame
- Lower is better
- Shows "MS (target: X.X)" based on target framerate
- 60 FPS = 16.67ms, 144 FPS = 6.94ms

**Memory (MB)**
- JavaScript heap memory usage
- Only available in Chromium browsers
- Automatically scales to GB for large values

**GPU Time (ms)**
- Actual GPU execution time via WebGL2 timer queries
- Falls back to estimation (70% of frame time) if unavailable
- Critical for identifying GPU bottlenecks

**CPU Time (ms)**
- Estimated CPU processing time
- Calculated from frame timing data
- Helps identify CPU vs GPU bottlenecks

**Triangles**
- Number of triangles rendered per frame
- Auto-formatted (K for thousands, M for millions)
- Higher counts impact performance

**Draw Calls**
- Number of WebGL draw calls per frame
- Lower is better for performance
- Each call has overhead
- Aggressive count makes multipass counting optional


## How It Works

### GPU Timing (WebGL2)
The library uses WebGL2's timer query extension for accurate GPU measurements:

1. Checks for `EXT_disjoint_timer_query_webgl2` support
2. Creates timer queries around render calls
3. Asynchronously retrieves GPU execution time
4. Handles GPU disjoint states gracefully
5. Falls back to estimation if unavailable

### WebGPU Support
For Three.js WebGPU renderer:

1. Detects WebGPU renderer automatically
3. Attempts timestamps asynchronously
4. Tracks both render and compute passes and with helpers

### Performance Optimizations
- **Ring Buffers**: Fixed-size circular buffers prevent memory growth
- **Lazy Updates**: Configurable intervals reduce overhead
- **Conditional Rendering**: Only updates visible stats
- **Efficient Algorithms**: O(1) operations for most updates
- **Minimal DOM Updates**: Batched updates via React

## Browser Support

| Browser | Basic | Memory | GPU Timing | WebGPU | Notes |
|---------|-------|--------|------------|---------|--------|
| Chrome 113+ | ✅ | ✅ | ✅ | ✅ | Full support |
| Edge 113+ | ✅ | ✅ | ✅ | ✅ | Full support |
| Firefox | ✅ | ❌ | ⚠️ | ❌ | Limited GPU timing |
| Safari | ✅ | ❌ | ⚠️ | ❌ | Limited GPU timing |
| Opera | ✅ | ✅ | ✅ | ✅ | Full support |

### Feature Detection
The library automatically detects and adapts to available features:
- Falls back gracefully when features are unavailable
- No errors thrown for missing APIs
- Attempts best possible metrics for each browser


## Example

### Basic Setup
```jsx
import { Canvas } from '@react-three/fiber';
import { useStatsPanel } from 'leva-r3f-stats';
import { Leva } from 'leva';

function App() {
  return (
    <>
      <Leva />
      <Canvas>
        <Scene />
      </Canvas>
    </>
  );
}

function Scene() {
  useStatsPanel();
  
  return (
    <>
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </>
  );
}
```

### Setup with Everything
```jsx
function Scene() {
  useStatsPanel({
    folder: {
      name: 'Performance Metrics',
      collapsed: false
    },
    targetFramerate: null, // Auto-detect
    graphHeight: 48,
    graphHistory: 200,
    fontSize: 10,
    trackCompute: true,
    stats: {
      fps: { show: true, order: 0 },
      ms: { show: true, order: 1 },
      gpu: { show: true, order: 2 },
      cpu: { show: true, order: 3 },
      memory: { show: true, order: 4 },
      compute: { show: true, order: 5 },
      triangles: { show: true, order: 6 },
      drawCalls: { show: true, order: 7 },
      vsync: { show: true, order: 8 }
    }
  });
}
```

## Performance Tips
This plugin does its best to give you as many options as possible and is meant mostly for development. Updating values in React will always be less performant than other canvas based methods. That said there are a few things you can do to help performance...

### Optimization Strategies

1. **Reduce Update Frequency**
```jsx
   useStatsPanel({ updateInterval: 250 }); // 4 updates per second
```

2. **Use Compact Mode**
```jsx
   useStatsPanel({ compact: true, fontSize: 9 });
```

3. **Disable Unused Stats**
```jsx
   useStatsPanel({
     stats: {
       cpu: { show: false },
       memory: { show: false },
       triangles: { show: false },
       drawCalls: { show: false }
     }
   });
   ```

4. **Disable Min/Max Tracking**
```jsx
   useStatsPanel({ showMinMax: false });
```

### Performance Impact
Typical roughly tested overhead on modern hardware:
- CPU: <0.5% additional usage
- Memory: ~200KB including buffers
- GPU: Negligible (timer queries are async)

## Troubleshooting

**GPU timing shows 0 or N/A**
- GPU timing requires WebGL2 context
- Check if `EXT_disjoint_timer_query_webgl2` is supported
- Some browsers/drivers disable GPU timing for security
- Try different browser or update graphics drivers

**Memory always shows 0**
- Memory API only available in Chromium browsers
- Check `performance.memory` in console
- Not available in Firefox, Safari

**Colors not working**
- Ensure `showColors: true` (default)
- Check if `defaultColor` is overriding

**Graph mode not displaying**
- Set `graphHeight` to value > 0
- Ensure sufficient panel width

## Acknowledgments
- Built for @react-three/fiber and Leva
- Stats-Gl [https://github.com/RenaudRohlinger/stats-gl/]
- Stats.js [https://github.com/mrdoob/stats.js]
- R3F Perf [https://github.com/utsuboco/r3f-perf]
- GameStats [https://github.com/ErikSom/gamestats]

## Future Considerations

- [ ] Better GPU timing
- [ ] Easy event monitoring
- [ ] WASM monitoring
- [ ] Better WebGPU compute tracking
- [ ] Relevant reporting
- [ ] Network monitoring

## License
MIT © Jeffrey Castellano  
See [LICENSE](LICENSE) for more information.