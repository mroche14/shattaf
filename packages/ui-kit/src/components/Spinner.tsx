import React from 'react';
import { cn } from '../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500',
        sizeClasses[size],
        className
      )}
    />
  );
};

export interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Chargement...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60">
      <Spinner size="lg" />
      <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  );
};

export interface LoadingCardProps {
  lines?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ lines = 3 }) => {
  return (
    <div
      className="rounded-lg p-6 animate-pulse"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="h-6 rounded w-3/4 mb-4" style={{ background: 'var(--bg-inner)' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded mb-2"
          style={{ width: `${100 - i * 15}%`, background: 'var(--bg-inner)' }}
        />
      ))}
    </div>
  );
};
