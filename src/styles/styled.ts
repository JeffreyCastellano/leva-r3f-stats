// src/styles/styles.ts
export const styles = {
  // Container styles
  statsContainer: (columns: number, fontSize: number) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '8px',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
  }),

  statsCompactWrapper: (columns: number, fontSize: number) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '4px 8px',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
  }),

  graphGridContainer: (columns: number) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '8px',
    padding: '8px',
    width: '100%',
  }),

  // Item styles
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '6px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: '4px',
    minWidth: 0,
  },

  statItemCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden',
  },

  graphItemContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: '4px',
    padding: '4px',
    overflow: 'hidden',
  },

  // Text styles
  statLabel: {
    fontSize: '0.85em',
    opacity: 0.7,
    color: '#999999',
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

  minMaxValue: {
    fontSize: '0.75em',
    opacity: 0.6,
    fontWeight: 'normal' as const,
    whiteSpace: 'nowrap' as const,
  },

  // Canvas style
  canvas: {
    display: 'block',
    width: '100%',
    imageRendering: 'pixelated' as const,
  },
};