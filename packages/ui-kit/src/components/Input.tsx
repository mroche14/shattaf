import React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg px-4 py-2 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-500/50',
              className
            )}
            style={{
              background: 'var(--bg-inner)',
              border: `1px solid ${error ? undefined : 'var(--border-color)'}`,
              color: 'var(--text-main)',
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-lg px-4 py-2 resize-none transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]',
            error && 'border-red-500 focus:ring-red-500/50',
            className
          )}
          style={{
            background: 'var(--bg-inner)',
            border: `1px solid ${error ? undefined : 'var(--border-color)'}`,
            color: 'var(--text-main)',
          }}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg px-4 py-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]',
            error && 'border-red-500',
            className
          )}
          style={{
            background: 'var(--bg-inner)',
            border: `1px solid var(--border-color)`,
            color: 'var(--text-main)',
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
