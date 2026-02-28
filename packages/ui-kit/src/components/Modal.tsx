import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          'relative w-full rounded-lg transition-colors duration-200',
          sizeClasses[size]
        )}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            {title && (
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors duration-200"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
          className="flex-1"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
