import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: 'positive' | 'negative' | 'neutral' | 'warning';
}

export interface PageHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Only show label on sm+ screens */
  hideLabel?: boolean;
  /** Tooltip text shown on hover when button is disabled */
  tooltip?: string;
}

export interface PageHeaderConfig {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageHeaderAction[];
  leftExtra?: React.ReactNode;
  rightExtra?: React.ReactNode;
  containerClassName?: string;
}

interface PageHeaderContextType {
  config: PageHeaderConfig | null;
  setConfig: (config: PageHeaderConfig | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  config: null,
  setConfig: () => {},
});

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PageHeaderConfig | null>(null);

  return (
    <PageHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(config: PageHeaderConfig | null, extraDeps: any[] = []) {
  const { setConfig } = useContext(PageHeaderContext);

  const title = config?.title ?? '';
  const breadcrumbLabels = config?.breadcrumbs?.map(b => b.label).join('/') ?? '';
  const actionLabels = config?.actions?.map(a => `${a.label}:${a.disabled}:${a.loading}`).join('/') ?? '';

  useEffect(() => {
    setConfig(config);
  }, [setConfig, !!config, title, breadcrumbLabels, actionLabels, ...extraDeps]);

  useEffect(() => {
    return () => setConfig(null);
  }, [setConfig]);
}

export function usePageHeaderContext() {
  return useContext(PageHeaderContext);
}
