import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/theme';
import { cn } from '../utils/cn';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useThemeStore();

  const resolvedTheme =
    theme === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg transition-colors duration-200',
        className
      )}
      style={{
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-main)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      title={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
