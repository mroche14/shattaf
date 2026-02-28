import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-inner)] text-[var(--text-secondary)]',
        primary: 'bg-cyan-900/50 text-cyan-300',
        success: 'bg-emerald-900/50 text-emerald-300',
        warning: 'bg-amber-900/50 text-amber-300',
        danger: 'bg-red-900/50 text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props}>
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'success' && 'bg-emerald-400',
              variant === 'warning' && 'bg-amber-400',
              variant === 'danger' && 'bg-red-400',
              variant === 'primary' && 'bg-cyan-400',
              (!variant || variant === 'default') && 'bg-gray-400'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export const StatusBadge: React.FC<{
  status: string;
  className?: string;
}> = ({ status, className }) => {
  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'primary' | 'default'; label: string }> = {
    draft: { variant: 'default', label: 'Brouillon' },
    submitted: { variant: 'primary', label: 'Soumis' },
    quoted: { variant: 'warning', label: 'Devis recu' },
    accepted: { variant: 'success', label: 'Accepte' },
    expired: { variant: 'danger', label: 'Expire' },
    pending_payment: { variant: 'warning', label: 'En attente' },
    paid: { variant: 'success', label: 'Paye' },
    scheduled: { variant: 'primary', label: 'Planifie' },
    in_progress: { variant: 'primary', label: 'En cours' },
    completed: { variant: 'success', label: 'Termine' },
    cancelled: { variant: 'danger', label: 'Annule' },
    refunded: { variant: 'warning', label: 'Rembourse' },
    en_route: { variant: 'primary', label: 'En route' },
    checked_in: { variant: 'primary', label: 'Arrive' },
    pending_signature: { variant: 'warning', label: 'Signature' },
  };

  const config = statusConfig[status] || { variant: 'default' as const, label: status };

  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
};
