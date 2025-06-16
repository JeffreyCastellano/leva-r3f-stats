import { CSSProperties } from 'react';

const baseStyles = {
  fontFamily: 'monospace',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
};

export const styles = {
  statsContainer: (columns: number, fontSize: number): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '8px',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    boxSizing: 'border-box',  // Add this
    overflow: 'hidden',        // Add this
  }),

  statsCompactWrapper: (columns: number, fontSize: number): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '4px 8px',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
  }),

  graphGridContainer: (columns: number): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '4px',
    width: '100%',
    boxSizing: 'border-box',  // Add this
    overflow: 'hidden',        // Add this
  }),

  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '6px',
    ...baseStyles,
    minWidth: 0,
  },

  statItemCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    overflow: 'hidden',
  },

  graphItemContainer: {
    ...baseStyles,
    padding: '4px',
    overflow: 'hidden',
  },

  statLabel: {
    fontSize: '0.85em',
    opacity: 0.7,
    color: '#aaa',
    marginBottom: '2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  statLabelCompact: {
    opacity: 0.6,
    color: '#999999',
    fontWeight: 'normal' as const,
    whiteSpace: 'nowrap' as const,
    fontSize: 'inherit',
  },

  statValue: {
    fontSize: '1em',
    fontWeight: 'bold' as const,
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },

  statValueCompact: {
    fontWeight: 'bold' as const,
    fontFamily: 'monospace',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '50px',
    fontSize: 'inherit',
  },

  labelSuffix: {
    fontSize: '0.8em',
    opacity: 0.85,
    marginLeft: '10px',
    letterSpacing: '-0.02em',
    fontWeight: 'normal' as const,
    whiteSpace: 'nowrap' as const,
  },

  minMaxValue: {
    fontSize: '0.75em',
    letterSpacing: '-0.02em',
    marginLeft: '6px',
    opacity: 0.85,
    fontWeight: 'normal' as const,
    whiteSpace: 'nowrap' as const,
  },

  canvas: {
    display: 'block',
    width: '100%',
  },
};