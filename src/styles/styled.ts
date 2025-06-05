import { styled } from '@stitches/react';

export const StatsContainer = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  padding: '8px',
  fontFamily: 'monospace',
  fontSize: '12px',
});

export const StatsCompactWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '100%',
});

export const StatsContainerCompact = styled('div', {
  display: 'flex',
  gap: '12px',
  padding: '2px 6px',
  fontFamily: 'monospace',
  fontSize: '11px',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
});

export const StatItem = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  padding: '4px',
  backgroundColor: 'rgba(0,0,0,0.1)',
  borderRadius: '4px',
});

export const StatItemCompact = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  flexShrink: 1,
  minWidth: 0,
});

export const StatLabel = styled('div', {
  fontSize: '10px',
  opacity: 0.7,
  color: '#999999',
  marginBottom: '2px',
});

export const StatLabelCompact = styled('span', {
  fontSize: '10px',
  opacity: 0.6,
  color: '#999999',
  fontWeight: 'normal',
  flexShrink: 0,
});

export const StatValue = styled('div', {
  fontSize: '12px',
  fontWeight: 'bold',
});

export const StatValueCompact = styled('span', {
  fontSize: '10px',
  fontWeight: 'bold',
  minWidth: '28px',
  textAlign: 'right',
  paddingLeft: '2px',
  paddingRight: '4px',
  fontFamily: 'monospace',
});

export const MinMaxValue = styled('span', {
  fontSize: '9px',
  opacity: 0.6,
  marginLeft: '4px',
  fontWeight: 'normal',
});