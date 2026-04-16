import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Plus, ChevronRight, Check, X, AlertTriangle, ChevronDown } from '@/components/icons';
import { CsvRow } from '@/utils/csvParser';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FIELD_TEXT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' };

// Standard CRM fields
const STANDARD_FIELDS = [
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'business_name', label: 'Business Name' },
  { key: 'tags', label: 'Tags' },
] as const;

interface ColumnMapping {
  csvColumn: string;
  mappedTo: string;
}

export type DuplicateHandling = 'skip' | 'update';

/** Inline tag dropdown that closes on outside click */
function TagDropdown({ assignTagIds, setAssignTagIds, availableTags, tagPopoverWidth }: {
  assignTagIds: string[];
  setAssignTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  availableTags: { id: string; name: string; color: string | null }[];
  tagPopoverWidth: number;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute('open');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <details ref={detailsRef} className="relative">
      <summary className="h-8 w-full field-text csv-column-mapper-select-trigger flex items-center justify-between px-3 groove-border bg-card hover:bg-muted/50 transition-colors list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <span className="truncate">{assignTagIds.length > 0 ? `${assignTagIds.length} tag${assignTagIds.length !== 1 ? 's' : ''} selected` : 'No Tags'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
      </summary>
      <div
        className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[280px] max-w-[520px] border border-border bg-sidebar shadow-md csv-column-mapper-tag-popover"
        style={{ width: `${tagPopoverWidth}px` }}
      >
        <div
          className="max-h-[240px] overflow-y-auto overscroll-contain py-1"
          onWheelCapture={(e) => e.stopPropagation()}
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
        >
          {availableTags.map(tag => {
            const isSelected = assignTagIds.includes(tag.id);
            return (
              <div
                key={tag.id}
                onClick={() => setAssignTagIds(prev => isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                className="flex items-center gap-2 py-1.5 px-3 hover:bg-muted/30 transition-colors cursor-pointer csv-column-mapper-tag-row"
              >
                <button
                  type="button"
                  className="flex items-center justify-center w-5 h-5 shrink-0 groove-border"
                  style={isSelected ? { backgroundColor: '#ffffff', borderColor: '#ffffff' } : undefined}
                >
                  {isSelected && <svg viewBox="0 0 16 15" fill="#000" shapeRendering="crispEdges" className="w-3 h-3"><rect x="1" y="5" width="3" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="5" y="9" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="9" y="5" width="3" height="3"/><rect x="11" y="3" width="3" height="3"/></svg>}
                </button>
                <span
                  className="inline-flex max-w-full items-center gap-1 border px-2 py-0.5 font-medium leading-none whitespace-nowrap truncate cursor-pointer [font-size:11px] [border-width:0.7px] csv-column-mapper-tag-badge"
                  style={{
                    backgroundColor: `${tag.color || '#6366f1'}26`,
                    borderColor: tag.color || '#6366f1',
                    color: '#FFFFFF',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    lineHeight: '1',
                    textTransform: 'none',
                    letterSpacing: 'normal',
                    maxWidth: `calc(${tagPopoverWidth}px - 56px)`,
                  }}
                >
                  {tag.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}


interface CsvColumnMapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  csvData: CsvRow[];
  onConfirm: (mappings: ColumnMapping[], duplicateHandling: DuplicateHandling, assignTagIds: string[]) => void;
  importing: boolean;
  existingCustomFields?: string[];
  availableTags?: { id: string; name: string; color: string | null }[];
}

function autoDetect(header: string): string {
  const h = header.toLowerCase().trim();
  if (h === 'first name' || h === 'first_name' || h === 'firstname') return 'first_name';
  if (h === 'last name' || h === 'last_name' || h === 'lastname') return 'last_name';
  if (h === 'email' || h === 'email address' || h === 'email_address') return 'email';
  if (h === 'phone' || h === 'phone number' || h === 'phone_number' || h === 'mobile') return 'phone';
  if (h === 'company' || h === 'company name' || h === 'company_name' || h === 'business' || h === 'business name' || h === 'business_name' || h === 'organization') return 'business_name';
  if (h === 'name' || h === 'full name' || h === 'fullname' || h === 'full_name') return 'first_name';
  if (h === 'id' || h === 'lead id' || h === 'lead_id' || h === 'leadid' || h === 'contact id' || h === 'contact_id' || h === 'contactid') return 'lead_id';
  if (h === 'tags' || h === 'tag' || h === 'labels' || h === 'label') return 'tags';
  return 'skip';
}

export const CsvColumnMapper: React.FC<CsvColumnMapperProps> = ({
  open,
  onOpenChange,
  csvHeaders,
  csvData,
  onConfirm,
  importing,
  existingCustomFields = [],
  availableTags = [],
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [showNewFieldInput, setShowNewFieldInput] = useState<number | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>('skip');
  const [assignTagIds, setAssignTagIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (csvHeaders.length > 0) {
      setMappings(csvHeaders.map(h => ({ csvColumn: h, mappedTo: autoDetect(h) })));
    }
  }, [csvHeaders]);

  const [customFields, setCustomFields] = useState<string[]>([]);

  // Merge existing custom fields from DB with locally-created ones
  const mergedCustomFields = useMemo(() => {
    const all = new Set([...existingCustomFields, ...customFields]);
    return Array.from(all);
  }, [existingCustomFields, customFields]);

  const allFieldOptions = useMemo(() => {
    return [
      { value: 'skip', label: 'Skip (Do Not Import)' },
      ...STANDARD_FIELDS.map(f => ({ value: f.key, label: f.label })),
      ...mergedCustomFields.map(f => ({ value: `custom:${f}`, label: f })),
    ];
  }, [mergedCustomFields]);

  const tagPopoverWidth = useMemo(() => {
    const longestTagLength = availableTags.reduce((max, tag) => Math.max(max, tag.name.length), 0);
    return Math.max(280, longestTagLength * 8 + 80);
  }, [availableTags]);

  const handleMappingChange = (index: number, value: string) => {
    setMappings(prev => {
      const next = [...prev];
      next[index] = { ...next[index], mappedTo: value };
      return next;
    });
  };

  const handleCreateField = (index: number) => {
    if (!newFieldName.trim()) return;
    const fieldName = newFieldName.trim();
    if (!customFields.includes(fieldName)) {
      setCustomFields(prev => [...prev, fieldName]);
    }
    handleMappingChange(index, `custom:${fieldName}`);
    setNewFieldName('');
    setShowNewFieldInput(null);
  };

  const mappedStandard = mappings.filter(m => STANDARD_FIELDS.some(s => s.key === m.mappedTo));
  const skipped = mappings.filter(m => m.mappedTo === 'skip');

  // Check if phone or email is mapped (required)
  const hasPhoneMapped = mappings.some(m => m.mappedTo === 'phone');
  const hasEmailMapped = mappings.some(m => m.mappedTo === 'email');
  const hasRequiredContactField = hasPhoneMapped || hasEmailMapped;

  const previewRows = csvData.slice(0, 3);

  if (!open) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto !p-0">
        <DialogHeader>
          <DialogTitle>Map Csv Columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 px-6 pt-6 pb-0">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap" style={FIELD_TEXT}>
            <span className="text-muted-foreground">{csvData.length} rows found</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{csvHeaders.length} columns</span>
            {mappedStandard.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">{mappedStandard.length} mapped</span>
              </>
            )}
            {skipped.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{skipped.length} skipped</span>
              </>
            )}
          </div>

          {/* Requirement warning */}
          {!hasRequiredContactField && mappings.length > 0 && (
            <div className="flex items-start gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p style={FIELD_TEXT} className="text-destructive">
                You must map at least one column to <span className="font-bold">Phone Number</span> or <span className="font-bold">Email</span> to import leads.
              </p>
            </div>
          )}

          {/* Mapping list */}
          <div className="space-y-3">
            {csvHeaders.map((header, idx) => {
              const mapping = mappings[idx];
              if (!mapping) return null;
              const sampleValues = previewRows.map(r => r[header]).filter(Boolean).slice(0, 2);

              return (
                <div
                  key={header}
                  className="border border-border rounded-md p-3 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {/* CSV column name */}
                    <div className="flex-1 min-w-0">
                      <p style={FIELD_TEXT} className="font-medium text-foreground truncate">
                        {header}
                      </p>
                      {sampleValues.length > 0 && (
                        <p style={FIELD_TEXT} className="text-muted-foreground truncate mt-0.5">
                          e.g. {sampleValues.join(', ')}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

                    {/* Mapping selector */}
                    <div className="w-[220px] shrink-0">
                      {showNewFieldInput === idx ? (
                        <div className="h-8 flex items-center groove-border px-3" style={FIELD_TEXT}>
                          <Plus className="w-3 h-3 mr-1.5 shrink-0" />
                          Create New Field
                        </div>
                      ) : (
                        <Select
                          value={mapping.mappedTo}
                          onValueChange={(val) => {
                            if (val === '__new_field__') {
                              setShowNewFieldInput(idx);
                            } else {
                              handleMappingChange(idx, val);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 field-text csv-column-mapper-select-trigger">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-sidebar csv-column-mapper-select-content">
                            {allFieldOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="field-text csv-column-mapper-select-item">
                                {opt.label}
                              </SelectItem>
                            ))}
                            <div className="groove-border !border-x-0 !border-b-0 mt-1 pt-1 -mx-1">
                              <SelectItem
                                value="__new_field__"
                                className="csv-column-mapper-select-item csv-column-mapper-create-btn"
                                style={{
                                  fontFamily: "'VT323', monospace",
                                  fontSize: '16px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  background: 'transparent',
                                  border: 'none',
                                  boxShadow: 'none',
                                }}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Plus className="w-3 h-3" />
                                  Create New Field
                                </span>
                              </SelectItem>
                            </div>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Tags warning notice */}
                  {mapping.mappedTo === 'tags' && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(0 70% 60%)' }}>
                        In order for the tags to properly sync, each tag <span className="uppercase font-bold">MUST</span> be separated using commas.
                      </p>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(0 70% 60%)' }}>
                        For example: tag one, tag two, tag three
                      </p>
                    </div>
                  )}

                  {/* Phone format info notice */}
                  {mapping.mappedTo === 'phone' && (
                    <div className="flex flex-col gap-1 mt-1">
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(0 70% 60%)' }}>
                        Phone numbers will be automatically normalized to international format.
                      </p>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(0 70% 60%)' }}>
                        Numbers without a + prefix will be auto-fixed if they match a valid international format. Unrecognized formats will be flagged with a ⚠ warning in the CRM.
                      </p>
                    </div>
                  )}

                  {/* New field creation inline */}
                  {showNewFieldInput === idx && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <Input
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          placeholder="Field name..."
                          className="h-8 w-full"
                          style={FIELD_TEXT}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateField(idx)}
                          autoFocus
                        />
                      </div>
                      <div className="w-[220px] shrink-0 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1"
                          onClick={() => handleCreateField(idx)}
                          disabled={!newFieldName.trim()}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Create
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1"
                          onClick={() => { setShowNewFieldInput(null); setNewFieldName(''); }}
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assign Tags section */}
          {availableTags.length > 0 && (
            <div className="border border-border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p style={FIELD_TEXT} className="font-medium text-foreground">Assign Tags</p>
                  <p style={FIELD_TEXT} className="text-muted-foreground mt-0.5">
                    Tags will be assigned to all imported contacts.
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

                <div className="w-[220px] shrink-0">
                  <TagDropdown
                    assignTagIds={assignTagIds}
                    setAssignTagIds={setAssignTagIds}
                    availableTags={availableTags}
                    tagPopoverWidth={tagPopoverWidth}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Duplicate handling setting — matching Agent Features pattern */}
          <div className="border border-border rounded-md p-3 space-y-2.5">
            <div>
              <Label className="text-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>Duplicate Lead Handling</Label>
              <p className="text-muted-foreground mt-[2px]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>
                Leads with matching phone number or email will be skipped.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {/* Skip Duplicates */}
              <button
                type="button"
                onClick={() => setDuplicateHandling('skip')}
                className={cn(
                  'text-left p-3 transition-colors duration-100 groove-border relative bg-card',
                  duplicateHandling !== 'skip' && 'hover:bg-muted/50'
                )}
              >
                {duplicateHandling === 'skip' && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: '1px solid hsl(var(--primary))',
                      boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.1)',
                    }}
                  />
                )}
                <div className="flex items-start gap-2">
                   <div className="w-5 h-5 groove-border flex items-center justify-center flex-shrink-0 mt-[1px] bg-card" style={duplicateHandling === 'skip' ? { backgroundColor: '#fff' } : undefined}>
                    {duplicateHandling === 'skip' && <svg viewBox="0 0 16 15" fill="#000" shapeRendering="crispEdges" className="w-3 h-3"><rect x="1" y="5" width="3" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="5" y="9" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="9" y="5" width="3" height="3"/><rect x="11" y="3" width="3" height="3"/></svg>}
                  </div>
                   <div className="min-w-0">
                    <div className={cn('text-foreground', duplicateHandling === 'skip' && 'text-primary')} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>
                      Skip Duplicates
                    </div>
                    <p className="text-muted-foreground mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>
                      Matching leads will not be imported.
                    </p>
                  </div>
                </div>
              </button>
              {/* Update Existing */}
              <button
                type="button"
                onClick={() => setDuplicateHandling('update')}
                className={cn(
                  'text-left p-3 transition-colors duration-100 groove-border relative bg-card',
                  duplicateHandling !== 'update' && 'hover:bg-muted/50'
                )}
              >
                {duplicateHandling === 'update' && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: '1px solid hsl(var(--primary))',
                      boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.1)',
                    }}
                  />
                )}
                <div className="flex items-start gap-2">
                   <div className="w-5 h-5 groove-border flex items-center justify-center flex-shrink-0 mt-[1px] bg-card" style={duplicateHandling === 'update' ? { backgroundColor: '#fff' } : undefined}>
                    {duplicateHandling === 'update' && <svg viewBox="0 0 16 15" fill="#000" shapeRendering="crispEdges" className="w-3 h-3"><rect x="1" y="5" width="3" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="5" y="9" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="9" y="5" width="3" height="3"/><rect x="11" y="3" width="3" height="3"/></svg>}
                  </div>
                   <div className="min-w-0">
                    <div className={cn('text-foreground', duplicateHandling === 'update' && 'text-primary')} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>
                      Update Existing
                    </div>
                    <p className="text-muted-foreground mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>
                      Matching leads will be updated with CSV data.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer buttons - full width 50/50, 8px gap from duplicate section */}
        <div className="px-6 pb-6 flex gap-2" style={{ paddingTop: '8px' }}>
          <Button
            variant="outline"
            className="flex-1 field-text"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 groove-btn-positive field-text"
            onClick={() => { onOpenChange(false); onConfirm(mappings, duplicateHandling, assignTagIds); }}
            disabled={importing || mappings.every(m => m.mappedTo === 'skip') || !hasRequiredContactField}
          >
            {importing ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Importing...</>
            ) : (
              <><Upload className="w-4 h-4 mr-1.5" />Import {csvData.length} Leads</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export type { ColumnMapping };
