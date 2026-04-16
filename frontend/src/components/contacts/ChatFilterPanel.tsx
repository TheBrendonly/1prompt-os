import React, { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Plus } from '@/components/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type ContactFilter } from '@/components/contacts/CrmFilterPanel';

const FIELD_FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const HEADER_FONT = { fontFamily: "'VT323', monospace", fontSize: '22px', fontWeight: 400, textTransform: 'uppercase' as const, lineHeight: 1, letterSpacing: '0.5px' };

export interface ChatFilterConfig {
  filters: ContactFilter[];
  tagFilters: string[];
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

interface ChatFilterPanelProps {
  open: boolean;
  onClose: () => void;
  columns: FilterableColumn[];
  config: ChatFilterConfig;
  onConfigChange: (config: ChatFilterConfig) => void;
  tags: Tag[];
}

export default function ChatFilterPanel({ open, onClose, columns, config, onConfigChange, tags }: ChatFilterPanelProps) {
  const [localConfig, setLocalConfig] = useState<ChatFilterConfig>(config);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateConfig = useCallback((newConfig: ChatFilterConfig) => {
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  }, [onConfigChange]);

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

  const toggleChannelFilter = (channel: string) => {
    const channelFilters = new Set(localConfig.channelFilters || []);
    if (channelFilters.has(channel)) {
      channelFilters.delete(channel);
    } else {
      channelFilters.add(channel);
    }
    updateConfig({ ...localConfig, channelFilters: Array.from(channelFilters) });
  };

  const clearAll = () => {
    updateConfig({ filters: [], tagFilters: [], channelFilters: [] });
  };

  const activeFilterCount = localConfig.filters.length + localConfig.tagFilters.length + (localConfig.channelFilters?.length || 0);

  const visibleTags = tagsExpanded ? tags : tags.slice(0, COLLAPSED_LIMIT);
  const hasMoreTags = tags.length > COLLAPSED_LIMIT;
  const visibleChannels = channelsExpanded ? [...ALL_CHANNELS, ...MORE_CHANNELS] : ALL_CHANNELS;
  const hasMoreChannels = MORE_CHANNELS.length > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop — covers the parent area with blur */}
      <div className="absolute inset-0 bg-black/40 z-[25] backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel — anchored inside the parent container */}
      <div
        className="absolute right-0 top-0 bottom-0 z-[26] flex flex-col bg-card"
        style={{
          width: 425,
          borderLeft: '3px groove hsl(var(--border-groove))',
        }}
      >
        {/* Header */}
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

            {/* Channel Filters */}
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
    </>
  );
}
