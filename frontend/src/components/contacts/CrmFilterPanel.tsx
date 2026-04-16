import React, { useState, useEffect, useCallback } from 'react';
import { X, Eye, EyeOff, Trash2, Plus, AlertTriangle, CheckCircle } from '@/components/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FIELD_FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const HEADER_FONT = { fontFamily: "'VT323', monospace", fontSize: '22px', fontWeight: 400, textTransform: 'uppercase' as const, lineHeight: 1, letterSpacing: '0.5px' };
const SECTION_FONT = { fontFamily: "'VT323', monospace", fontSize: '18px', textTransform: 'uppercase' as const, letterSpacing: '2px' };

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface ContactFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface TagFilter {
  tagId: string;
  tagName: string;
}

export type StatusFilterValue = 'has_errors' | 'no_errors';

export interface CrmFilterConfig {
  hiddenColumns: string[];
  filters: ContactFilter[];
  tagFilters: string[]; // tag IDs
  statusFilters?: StatusFilterValue[];
  channelFilters?: string[];
}

interface FilterableColumn {
  key: string;
  label: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

const FILTER_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does Not Equal' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const COLLAPSED_LIMIT = 5;

const ALL_CHANNELS = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
];

const MORE_CHANNELS = [
  { value: 'imessage', label: 'iMessage' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
];

interface CrmFilterPanelProps {
  open: boolean;
  onClose: () => void;
  columns: FilterableColumn[];
  config: CrmFilterConfig;
  onConfigChange: (config: CrmFilterConfig) => void;
  tags: Tag[];
  showColumnsSection?: boolean;
  hideOuterBorder?: boolean;
  showStatusSection?: boolean;
  showChannelSection?: boolean;
}

export default function CrmFilterPanel({ open, onClose, columns, config, onConfigChange, tags, showColumnsSection = true, hideOuterBorder = false, showStatusSection = false, showChannelSection = false }: CrmFilterPanelProps) {
  const [localConfig, setLocalConfig] = useState<CrmFilterConfig>(config);
  const [columnsExpanded, setColumnsExpanded] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateConfig = useCallback((newConfig: CrmFilterConfig) => {
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  }, [onConfigChange]);

  const toggleColumn = (key: string) => {
    const hidden = new Set(localConfig.hiddenColumns);
    if (hidden.has(key)) {
      hidden.delete(key);
    } else {
      hidden.add(key);
    }
    updateConfig({ ...localConfig, hiddenColumns: Array.from(hidden) });
  };

  const addFilter = () => {
    const newFilter: ContactFilter = {
      id: crypto.randomUUID(),
      field: columns[0]?.key || 'contact_name',
      operator: 'contains',
      value: '',
    };
    updateConfig({ ...localConfig, filters: [...localConfig.filters, newFilter] });
  };

  const updateFilter = (id: string, updates: Partial<ContactFilter>) => {
    updateConfig({
      ...localConfig,
      filters: localConfig.filters.map(f => f.id === id ? { ...f, ...updates } : f),
    });
  };

  const removeFilter = (id: string) => {
    updateConfig({
      ...localConfig,
      filters: localConfig.filters.filter(f => f.id !== id),
    });
  };

  const toggleTagFilter = (tagId: string) => {
    const tagFilters = new Set(localConfig.tagFilters);
    if (tagFilters.has(tagId)) {
      tagFilters.delete(tagId);
    } else {
      tagFilters.add(tagId);
    }
    updateConfig({ ...localConfig, tagFilters: Array.from(tagFilters) });
  };

  const toggleStatusFilter = (value: StatusFilterValue) => {
    const current = new Set(localConfig.statusFilters || []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    updateConfig({ ...localConfig, statusFilters: Array.from(current) });
  };

  const toggleChannelFilter = (channel: string) => {
    const current = new Set(localConfig.channelFilters || []);
    if (current.has(channel)) {
      current.delete(channel);
    } else {
      current.add(channel);
    }
    updateConfig({ ...localConfig, channelFilters: Array.from(current) });
  };

  const clearAll = () => {
    updateConfig({ hiddenColumns: [], filters: [], tagFilters: [], statusFilters: [], channelFilters: [] });
  };

  const activeFilterCount = localConfig.filters.length + localConfig.tagFilters.length + (localConfig.statusFilters?.length || 0) + (localConfig.channelFilters?.length || 0) + (showColumnsSection ? localConfig.hiddenColumns.length : 0);

  // Columns to display (collapsed vs expanded)
  const visibleColumns = columnsExpanded ? columns : columns.slice(0, COLLAPSED_LIMIT);
  const hasMoreColumns = columns.length > COLLAPSED_LIMIT;

  // Tags to display (collapsed vs expanded)
  const visibleTags = tagsExpanded ? tags : tags.slice(0, COLLAPSED_LIMIT);
  const hasMoreTags = tags.length > COLLAPSED_LIMIT;

  // Channels to display
  const visibleChannels = channelsExpanded ? [...ALL_CHANNELS, ...MORE_CHANNELS] : ALL_CHANNELS;
  const hasMoreChannels = MORE_CHANNELS.length > 0;

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[25] overflow-hidden"
      style={hideOuterBorder ? undefined : { border: '3px groove hsl(var(--border-groove))' }}
      onClick={onClose}
    >
      {/* Backdrop — covers the table area with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Panel — anchored inside the table container */}
      <div
        className="absolute right-0 top-0 bottom-0 z-[1] flex flex-col bg-card"
        style={{
          width: 425,
          borderLeft: '3px groove hsl(var(--border-groove))',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header — 52px to match CRM header */}
        <div className="flex items-center justify-between px-5 shrink-0" style={{ height: '53.5px', borderBottom: '3px groove hsl(var(--border-groove))' }}>
          <span style={HEADER_FONT}>Filters</span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="groove-btn groove-btn-destructive flex items-center justify-center !h-8 !px-3 gap-1.5"
                style={FIELD_FONT}
              >
                <X className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="groove-btn flex items-center justify-center !h-8 !w-8 !p-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            {/* Column Visibility */}
            {showColumnsSection && (
              <div>
                <div className="section-separator mb-4">
                  <span>Columns</span>
                </div>
                <div className="-mx-5">
                  {visibleColumns.map(col => {
                    const isHidden = localConfig.hiddenColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`w-full flex items-center justify-between px-5 py-2 transition-colors ${
                          isHidden ? 'text-muted-foreground hover:bg-muted/30' : 'text-foreground hover:bg-muted/30'
                        }`}
                        style={FIELD_FONT}
                      >
                        <span>{col.label}</span>
                        {isHidden ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {hasMoreColumns && (
                  <button
                    onClick={() => setColumnsExpanded(!columnsExpanded)}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 !h-8 hover:bg-accent/50 transition-colors rounded-sm"
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '16px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    <Plus className="w-3 h-3" style={{ transform: columnsExpanded ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    {columnsExpanded ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </div>
            )}

            {/* Status Filters */}
            {showStatusSection && (
              <div>
                <div className="section-separator mb-4">
                  <span>Status</span>
                </div>
                <div className="-mx-5">
                  {([
                    { value: 'has_errors' as StatusFilterValue, label: 'Has Errors', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'hsl(var(--destructive))' },
                    { value: 'no_errors' as StatusFilterValue, label: 'No Errors', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'hsl(var(--success))' },
                  ]).map(status => {
                    const isActive = (localConfig.statusFilters || []).includes(status.value);
                    return (
                      <button
                        key={status.value}
                        onClick={() => toggleStatusFilter(status.value)}
                        className={`w-full flex items-center gap-2.5 px-5 py-2 transition-colors ${
                          isActive ? 'bg-primary/10' : 'hover:bg-muted/30'
                        }`}
                        style={FIELD_FONT}
                      >
                        <Checkbox checked={isActive} className="pointer-events-none" />
                        <span className="flex items-center gap-1.5" style={{ color: status.color }}>
                          {status.icon}
                          {status.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Channel Filters */}
            {showChannelSection && (
              <div>
                <div className="section-separator mb-4">
                  <span>Channel</span>
                </div>
                <div className="-mx-5">
                  {visibleChannels.map(ch => {
                    const isActive = (localConfig.channelFilters || []).includes(ch.value);
                    return (
                      <button
                        key={ch.value}
                        onClick={() => toggleChannelFilter(ch.value)}
                        className={`w-full flex items-center gap-2.5 px-5 py-2 transition-colors ${
                          isActive ? 'bg-primary/10' : 'hover:bg-muted/30'
                        }`}
                        style={FIELD_FONT}
                      >
                        <Checkbox checked={isActive} className="pointer-events-none" />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
                {hasMoreChannels && (
                  <button
                    onClick={() => setChannelsExpanded(!channelsExpanded)}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 !h-8 hover:bg-accent/50 transition-colors rounded-sm"
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '16px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    <Plus className="w-3 h-3" style={{ transform: channelsExpanded ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    {channelsExpanded ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </div>
            )}

            {/* Field Filters */}
            <div>
              <div className="section-separator mb-4">
                <span>Filters</span>
              </div>
              <div className="space-y-3">
                {localConfig.filters.map(filter => {
                  const needsValue = !['is_empty', 'is_not_empty'].includes(filter.operator);
                  return (
                    <div key={filter.id} className="space-y-2 p-3 rounded-sm" style={{ border: '1px solid hsl(var(--border))' }}>
                      <div className="flex items-center gap-2">
                        <Select
                          value={filter.field}
                          onValueChange={val => updateFilter(filter.id, { field: val })}
                        >
                          <SelectTrigger className="flex-1 h-8 field-text csv-column-mapper-select-trigger">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-sidebar csv-column-mapper-select-content">
                            {columns.map(col => (
                              <SelectItem key={col.key} value={col.key} className="field-text csv-column-mapper-select-item cursor-pointer">
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="groove-btn groove-btn-destructive flex items-center justify-center !h-8 !w-8 !p-0 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Select
                        value={filter.operator}
                        onValueChange={val => updateFilter(filter.id, { operator: val })}
                      >
                        <SelectTrigger className="h-8 field-text csv-column-mapper-select-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-sidebar csv-column-mapper-select-content">
                          {FILTER_OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value} className="field-text csv-column-mapper-select-item cursor-pointer">
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {needsValue && (
                        <Input
                          value={filter.value}
                          onChange={e => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Filter value..."
                          className="h-8"
                          style={FIELD_FONT}
                        />
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addFilter}
                  className="groove-btn flex items-center gap-1.5 !h-8 !px-3 w-full justify-center"
                  style={FIELD_FONT}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Filter
                </button>
              </div>
            </div>

            {/* Tag Filters */}
            {tags.length > 0 && (
              <div>
                <div className="section-separator mb-4">
                  <span>Tags</span>
                </div>
                <div className="-mx-5">
                  {visibleTags.map(tag => {
                    const isActive = localConfig.tagFilters.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTagFilter(tag.id)}
                        className={`w-full flex items-center gap-2.5 px-5 py-2 transition-colors ${
                          isActive ? 'bg-primary/10' : 'hover:bg-muted/30'
                        }`}
                        style={FIELD_FONT}
                      >
                        <Checkbox checked={isActive} className="pointer-events-none" />
                        <span
                          className="inline-flex items-center border px-2 py-0.5 font-medium leading-none whitespace-nowrap"
                          style={{
                            fontSize: '11px',
                            borderWidth: '0.7px',
                            backgroundColor: `${tag.color || '#6366f1'}26`,
                            borderColor: tag.color || '#6366f1',
                            color: '#FFFFFF',
                          }}
                        >
                          {tag.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {hasMoreTags && (
                  <button
                    onClick={() => setTagsExpanded(!tagsExpanded)}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 !h-8 hover:bg-accent/50 transition-colors rounded-sm"
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '16px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    <Plus className="w-3 h-3" style={{ transform: tagsExpanded ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    {tagsExpanded ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
