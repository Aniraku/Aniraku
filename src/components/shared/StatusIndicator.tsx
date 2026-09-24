import React from 'react';

interface StatusIndicatorProps {
  status?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const getStatusColor = (status?: string): string => {
    if (!status) return 'gray';

    const s = status.toLowerCase().trim();

    if (s === 'ongoing' || s === 'releasing') return 'var(--ongoing)';
    if (s === 'completed' || s === 'finished') return 'var(--completed)';
    if (s === 'cancelled') return 'var(--cancelled)';
    if (s === 'not yet aired' || s === 'not_yet_released') return 'var(--not-yet-aired)';

    return 'gray';
  };

  return (
    <span
      className={`status-indicator ${className}`.trim()}
      title={status ?? 'Unknown'}
    >
      <span
        className="status-dot"
        style={{ backgroundColor: getStatusColor(status) }}
      />
    </span>
  );
};

export default StatusIndicator;
