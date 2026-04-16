import React from 'react';
import { cn } from '@/lib/utils';

type StatusTagVariant = 'positive' | 'negative' | 'neutral' | 'warning';

interface StatusTagProps {
  children: React.ReactNode;
  variant: StatusTagVariant;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const StatusTag: React.FC<StatusTagProps> = ({
  children,
  variant,
  className,
  icon,
  onClick,
}) => {
  const variantClass: Record<StatusTagVariant, string> = {
    positive: 'terminal-tag-green',
    negative: 'terminal-tag-red',
    neutral: 'terminal-tag-neutral',
    warning: 'terminal-tag-yellow',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'terminal-tag',
        variantClass[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};
