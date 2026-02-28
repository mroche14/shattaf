import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const styles = {
    info: 'bg-cyan-900/30 border-cyan-700 text-cyan-300',
    success: 'bg-emerald-900/30 border-emerald-700 text-emerald-300',
    warning: 'bg-amber-900/30 border-amber-700 text-amber-300',
    error: 'bg-red-900/30 border-red-700 text-red-300',
  };

  const Icon = icons[variant];

  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', styles[variant], className)}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-bold mb-1">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded transition-colors duration-200 hover:bg-[var(--bg-hover)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export interface ToastProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ variant = 'info', message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert variant={variant} onClose={onClose}>
        {message}
      </Alert>
    </div>
  );
};
