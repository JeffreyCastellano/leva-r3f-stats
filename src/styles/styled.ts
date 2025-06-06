import { styled } from '@stitches/react';

export const StatsContainer = styled('div', {
  display: 'grid',
  gap: '8px',
  padding: '8px',
  width: '100%',
  fontFamily: 'monospace',
  variants: {
    columns: {
      1: { gridTemplateColumns: '1fr' },
      2: { gridTemplateColumns: 'repeat(2, 1fr)' },
      3: { gridTemplateColumns: 'repeat(3, 1fr)' },
      4: { gridTemplateColumns: 'repeat(4, 1fr)' },
      5: { gridTemplateColumns: 'repeat(5, 1fr)' },
      6: { gridTemplateColumns: 'repeat(6, 1fr)' },
    },
    fontSize: {
      8: { fontSize: '8px' },
      9: { fontSize: '9px' },
      10: { fontSize: '10px' },
      11: { fontSize: '11px' },
      12: { fontSize: '12px' },
      13: { fontSize: '13px' },
      14: { fontSize: '14px' },
    }
  },
  defaultVariants: {
    columns: 2,
    fontSize: 12
  }
});

export const StatsCompactWrapper = styled('div', {
  display: 'grid',
  gap: '8px',
  padding: '4px 8px',
  width: '100%',
  fontFamily: 'monospace',
  variants: {
    columns: {
      1: { gridTemplateColumns: '1fr' },
      2: { gridTemplateColumns: 'repeat(2, 1fr)' },
      3: { gridTemplateColumns: 'repeat(3, 1fr)' },
      4: { gridTemplateColumns: 'repeat(4, 1fr)' },
      5: { gridTemplateColumns: 'repeat(5, 1fr)' },
      6: { gridTemplateColumns: 'repeat(6, 1fr)' },
      7: { gridTemplateColumns: 'repeat(7, 1fr)' },
      8: { gridTemplateColumns: 'repeat(8, 1fr)' },
    },
    fontSize: {
      8: { fontSize: '8px' },
      9: { fontSize: '9px' },
      10: { fontSize: '10px' },
      11: { fontSize: '11px' },
      12: { fontSize: '12px' },
      13: { fontSize: '13px' },
      14: { fontSize: '14px' },
    }
  },
  defaultVariants: {
    columns: 4,
    fontSize: 11
  }
});

export const GraphGridContainer = styled('div', {
  display: 'grid',
  gap: '8px',
  padding: '8px',
  width: '100%',
  variants: {
    columns: {
      1: { gridTemplateColumns: '1fr' },
      2: { gridTemplateColumns: 'repeat(2, 1fr)' },
      3: { gridTemplateColumns: 'repeat(3, 1fr)' },
      4: { gridTemplateColumns: 'repeat(4, 1fr)' },
    }
  },
  defaultVariants: {
    columns: 2
  }
});

export const GraphItemContainer = styled('div', {
  backgroundColor: 'rgba(0,0,0,0.1)',
  borderRadius: '4px',
  padding: '4px',
  overflow: 'hidden',
});

export const StatItem = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  padding: '6px',
  backgroundColor: 'rgba(0,0,0,0.1)',
  borderRadius: '4px',
  minWidth: 0,
});

export const StatItemCompact = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  overflow: 'hidden',
});

export const StatLabel = styled('div', {
  fontSize: '0.85em', // Relative to parent
  opacity: 0.7,
  color: '#999999',
  marginBottom: '2px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const StatLabelCompact = styled('span', {
  opacity: 0.6,
  color: '#999999',
  fontWeight: 'normal',
  whiteSpace: 'nowrap',
  fontSize: 'inherit', // Inherit from parent
});

export const StatValue = styled('div', {
  fontSize: '1em', // Relative to parent
  fontWeight: 'bold',
  fontFamily: 'monospace',
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
});

export const StatValueCompact = styled('span', {
  fontWeight: 'bold',
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '50px',
  fontSize: 'inherit', // Inherit from parent
});

export const MinMaxValue = styled('span', {
  fontSize: '0.75em', // Relative to parent
  opacity: 0.6,
  fontWeight: 'normal',
  whiteSpace: 'nowrap',
});

export const StatItemContainer = StatItem;
export const StatsGridContainer = StatsContainer;
export const StatsCompactRow = StatsCompactWrapper;
export const StatsCompactContainer = StatsCompactWrapper;
export const StatsContainerCompact = StatsCompactWrapper;