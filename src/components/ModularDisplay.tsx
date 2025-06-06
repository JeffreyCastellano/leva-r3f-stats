// src/components/ModularDisplay.tsx
import { StatsData, StatsOptions } from '../types';
import { createStatConfigs } from '../utils/statConfigs';
import { calculateThresholds, getTargetFrameRate } from '../utils/thresholds';
import { StatItem } from './StatItem';
import { GraphCanvas } from './GraphCanvas';
import { globalBuffers } from '../store/globalBuffers';
import { styles } from '../styles/styled';
import { formatTriangles, formatFPS, formatMS, formatMemory, formatGPU } from '../utils/formatters';

interface ModularDisplayProps {
  stats: StatsData;
  options: StatsOptions;
}

export function ModularDisplay({ stats, options }: ModularDisplayProps) {
  const targetFPS = options.targetFramerate || getTargetFrameRate(stats.vsync);
  const thresholds = calculateThresholds(targetFPS);
  const configs = createStatConfigs(options, thresholds);

  const displayConfigs = options.compact 
    ? configs.filter(c => c.showInCompact === true)
    : configs;

  const visibleConfigs = displayConfigs.filter(config => {
    if (config.key === 'compute' && (!stats.isWebGPU || stats.compute === 0)) {
      return false;
    }
    if (config.key === 'vsync' && !stats.vsync) {
      return false;
    }
    return true;
  });

  let columns: number;
  if (options.graphHeight && options.graphHeight > 0) {
    columns = options.columnsGraph ?? options.columns ?? 2;
  } else if (options.compact) {
    columns = options.columnsCompact ?? options.columns ?? 4;
  } else {
    columns = options.columns ?? 2;
  }

  columns = Math.max(1, Math.min(columns, 8));

  const fontSize = options.fontSize || (options.compact ? 11 : 12);

  // Color functions
  const getFPSColor = (fps: number) => {
    if (fps < thresholds.fpsCritical) return '#ff6b6b';
    if (fps < thresholds.fpsWarning) return '#ffd93d';
    return '#51cf66';
  };

  const getMSColor = (ms: number) => {
    if (ms > thresholds.msCritical) return '#ff6b6b';
    if (ms > thresholds.msWarning) return '#ffd93d';
    return '#51cf66';
  };

  // Graph Mode
  if (options.graphHeight && options.graphHeight > 0) {
    const graphConfigs = visibleConfigs.filter(c => 
      c.key !== 'vsync' && 
      (stats[c.key] as number) > 0
    );

    return (
      <div style={styles.graphGridContainer(columns)}>
        {graphConfigs.map(config => {
          const buffer = globalBuffers[config.key as keyof typeof globalBuffers];
          if (!buffer) return null;

          const value = stats[config.key] as number;
          const color = options.showColors !== false && config.color 
            ? config.color(value, thresholds) 
            : options.defaultColor || '#999';

          return (
            <div key={config.key} style={styles.graphItemContainer}>
              <GraphCanvas
                data={buffer}
                color={color}
                min={config.graphMin || 0}
                max={config.graphMax ? config.graphMax(thresholds) : 100}
                height={options.graphHeight || 48}
                label={config.shortLabel || config.label}
                unit={config.unit || ''}
                currentValue={value}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Compact Mode
  if (options.compact) {
    const showVsync = options.vsync !== false && stats.vsync;

    // If we're using the old compact display logic
    if (!visibleConfigs.length || options.stats === undefined) {
      return (
        <div style={styles.statsCompactWrapper(columns, fontSize)}>
          <div style={styles.statItemCompact}>
            <span style={styles.statLabelCompact}>FPS:</span>
            <span style={{
              ...styles.statValueCompact,
              color: options.showColors !== false ? getFPSColor(stats.fps) : options.defaultColor || '#999999',
              minWidth: '28px',
              fontFamily: 'monospace'
            }}>
              {formatFPS(stats.fps)}
            </span>
          </div>

          <div style={styles.statItemCompact}>
            <span style={styles.statLabelCompact}>MS:</span>
            <span style={{
              ...styles.statValueCompact,
              color: options.showColors !== false ? getMSColor(stats.ms) : options.defaultColor || '#999999',
              minWidth: '28px',
              fontFamily: 'monospace'
            }}>
              {formatMS(stats.ms)}
            </span>
          </div>

          <div style={styles.statItemCompact}>
            <span style={styles.statLabelCompact}>MEM:</span>
            <span style={{
              ...styles.statValueCompact,
              color: options.defaultColor || '#999999',
              minWidth: '28px',
              fontFamily: 'monospace'
            }}>
              {formatMemory(stats.memory)}
            </span>
          </div>

          <div style={styles.statItemCompact}>
            <span style={styles.statLabelCompact}>GPU:</span>
            <span style={{
              ...styles.statValueCompact,
              color: options.showColors !== false ? getMSColor(Number(stats.gpu)) : options.defaultColor || '#999999',
              minWidth: '28px',
              fontFamily: 'monospace'
            }}>
              {formatGPU(stats.gpu)}
            </span>
          </div>

          {showVsync && (
            <div style={styles.statItemCompact}>
              <span style={{ fontSize: '9px', opacity: 0.5 }}>
                {stats.vsync}Hz
              </span>
            </div>
          )}

          {options.trackCompute && stats.isWebGPU && stats.compute > 0 && (
            <div style={styles.statItemCompact}>
              <span style={styles.statLabelCompact}>COMP:</span>
              <span style={{
                ...styles.statValueCompact,
                color: options.showColors !== false ? getMSColor(stats.compute) : options.defaultColor || '#999999',
                minWidth: '28px',
                fontFamily: 'monospace'
              }}>
                {formatMS(stats.compute)}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Modular compact display
    return (
      <div style={styles.statsCompactWrapper(columns, fontSize)}>
        {visibleConfigs.map(config => {
          const value = stats[config.key] as number;
          const color = options.showColors !== false && config.color 
            ? config.color(value, thresholds) 
            : options.defaultColor || '#999999';

          let formattedValue = config.format(value);
          if (config.key === 'triangles') {
            formattedValue = formatTriangles(value);
          }

          // Special handling for vsync in compact mode
          if (config.key === 'vsync' && value) {
            return (
              <div key={config.key} style={styles.statItemCompact}>
                <span style={{ fontSize: '9px', opacity: 0.5 }}>
                  {value}Hz
                </span>
              </div>
            );
          }

          return (
            <div key={config.key} style={styles.statItemCompact}>
              <span style={styles.statLabelCompact}>{config.shortLabel}:</span>
              <span style={{ ...styles.statValueCompact, color }}>
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Regular Grid Mode
  const showMinMax = options.showMinMax !== false;

  // If we're using the old grid display logic
  if (!visibleConfigs.length || options.stats === undefined) {
    return (
      <>
        <div style={styles.statsContainer(columns, fontSize)}>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>
              FPS (target: {targetFPS})
            </div>
            <div style={{
              ...styles.statValue,
              color: options.showColors !== false ? getFPSColor(stats.fps) : options.defaultColor
            }}>
              {formatFPS(stats.fps)}
              {showMinMax && (
                <span style={styles.minMaxValue}>
                  {formatFPS(globalBuffers.fps.getMin())}-{formatFPS(globalBuffers.fps.getMax())}
                </span>
              )}
            </div>
          </div>

          <div style={styles.statItem}>
            <div style={styles.statLabel}>MS (target: {thresholds.targetMS.toFixed(1)})</div>
            <div style={{
              ...styles.statValue,
              color: options.showColors !== false ? getMSColor(stats.ms) : options.defaultColor
            }}>
              {formatMS(stats.ms)}
              {showMinMax && (
                <span style={styles.minMaxValue}>
                  {formatMS(globalBuffers.ms.getMin())}-{formatMS(globalBuffers.ms.getMax())}
                </span>
              )}
            </div>
          </div>

          <div style={styles.statItem}>
            <div style={styles.statLabel}>Memory (MB)</div>
            <div style={{
              ...styles.statValue,
              color: options.defaultColor || undefined
            }}>
              {formatMemory(stats.memory)}
              {showMinMax && (
                <span style={styles.minMaxValue}>
                  {formatMemory(globalBuffers.memory.getMin())}-{formatMemory(globalBuffers.memory.getMax())}
                </span>
              )}
            </div>
          </div>

          <div style={styles.statItem}>
            <div style={styles.statLabel}>GPU (ms)</div>
            <div style={{
              ...styles.statValue,
              color: options.showColors !== false ? getMSColor(parseFloat(stats.gpu.toString())) : options.defaultColor
            }}>
              {formatGPU(stats.gpu)}
              {showMinMax && (
                <span style={styles.minMaxValue}>
                  {formatGPU(globalBuffers.gpu.getMin())}-{formatGPU(globalBuffers.gpu.getMax())}
                </span>
              )}
            </div>
          </div>
        </div>

        {options.trackCompute && stats.isWebGPU && stats.compute > 0 && (
          <div style={styles.statsContainer(columns, fontSize)}>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Compute (ms)</div>
              <div style={{
                ...styles.statValue,
                color: options.showColors !== false ? getMSColor(stats.compute) : options.defaultColor
              }}>
                {formatMS(stats.compute)}
                {showMinMax && (
                  <span style={styles.minMaxValue}>
                    {formatMS(globalBuffers.compute.getMin())}-{formatMS(globalBuffers.compute.getMax())}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Modular grid display
  return (
    <div style={styles.statsContainer(columns, fontSize)}>
      {visibleConfigs.map(config => (
        <StatItem
          key={config.key}
          config={config}
          stats={stats}
          showMinMax={showMinMax}
          showColors={options.showColors !== false}
          defaultColor={options.defaultColor}
          compact={false}
        />
      ))}
    </div>
  );
}