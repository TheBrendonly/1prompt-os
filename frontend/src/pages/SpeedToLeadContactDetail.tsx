import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, MessageSquare, Save } from '@/components/icons';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { getContacts, generateConversation, type DemoContact, type DemoMessage } from '@/data/speedToLeadData';
import { format } from 'date-fns';
import { toast } from 'sonner';

const FIELD_TEXT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' };
const SECTION_TITLE: React.CSSProperties = { fontSize: '18px', fontFamily: "'VT323', monospace", fontWeight: 400, letterSpacing: '0.5px', textTransform: 'uppercase' as const };

export default function SpeedToLeadContactDetail() {
  const { clientId, contactId } = useParams();
  const navigate = useNavigate();
  const contacts = useMemo(() => getContacts(), []);
  
  const currentIndex = contacts.findIndex(c => c.id === contactId);
  const contact = contacts[currentIndex] || null;
  const messages = useMemo(() => contact ? generateConversation(contact) : [], [contact]);

  // Editable fields state
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edit state when contact changes
  useMemo(() => {
    if (contact) {
      setEditData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        email: contact.email,
        city: contact.city,
        state: contact.state,
        address: contact.address,
        service_interest: contact.service_interest,
        property_size: contact.property_size || '',
      });
      setHasChanges(false);
    }
  }, [contactId]);

  const updateField = (key: string, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Contact saved');
    setHasChanges(false);
  };

  usePageHeader({
    title: 'Speed to Lead',
    breadcrumbs: [
      { label: 'Contacts', onClick: () => navigate(`/client/${clientId}/speed-to-lead/contacts`) },
      { label: 'Contact Details' },
    ],
    leftExtra: (
      <div className="flex items-center gap-1.5 ml-3">
        <span style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }} className="text-muted-foreground">
          {currentIndex + 1}/{contacts.length}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7 groove-btn" disabled={currentIndex <= 0}
          onClick={() => navigate(`/client/${clientId}/speed-to-lead/contacts/${contacts[currentIndex - 1]?.id}`, { replace: true })}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 groove-btn" disabled={currentIndex >= contacts.length - 1}
          onClick={() => navigate(`/client/${clientId}/speed-to-lead/contacts/${contacts[currentIndex + 1]?.id}`, { replace: true })}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    ),
  }, [currentIndex, contacts.length, clientId]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
        <p style={FIELD_TEXT} className="text-muted-foreground">Contact not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/client/${clientId}/speed-to-lead/contacts`)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  const tagColor = (tag: string) => {
    if (tag === 'Enhanced') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (tag === 'Legacy') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (tag === 'Replied') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (tag === 'No Reply') return 'bg-muted text-muted-foreground border-border';
    if (tag === 'SMS') return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    if (tag === 'IMESSAGE') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (tag === 'WHATSAPP') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const editableFields = [
    { label: 'First Name', key: 'first_name' },
    { label: 'Last Name', key: 'last_name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Email', key: 'email' },
    { label: 'City', key: 'city' },
    { label: 'State', key: 'state' },
    { label: 'Address', key: 'address' },
    { label: 'Service Interest', key: 'service_interest' },
    { label: 'Property Size', key: 'property_size' },
  ];

  const readOnlyFields = [
    { label: 'Channel', value: contact.channel.toUpperCase() },
    { label: 'Approach', value: contact.approach === 'enhanced' ? 'Enhanced' : 'Legacy' },
    { label: 'Created', value: format(new Date(contact.created_at), 'MMM d, yyyy h:mm a') },
  ];

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      <div className="container mx-auto max-w-7xl flex flex-col h-full pt-6" style={{ paddingBottom: '24px' }}>
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left: Contact Info */}
          <div className="w-80 shrink-0 groove-border bg-card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-dashed border-border shrink-0 flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium" style={FIELD_TEXT}>{editData.first_name || contact.first_name} {editData.last_name || contact.last_name}</p>
                {contact.tags.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {contact.tags.map(tag => (
                      <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border rounded-sm ${tagColor(tag)}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {hasChanges && (
                <Button size="sm" className="h-7 gap-1.5 groove-btn" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5" />
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}>SAVE</span>
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {editableFields.map(f => (
                <div key={f.key}>
                  <label className="block text-muted-foreground mb-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {f.label}
                  </label>
                  <Input
                    className="h-8 groove-border bg-background"
                    style={FIELD_TEXT}
                    value={editData[f.key] || ''}
                    onChange={e => updateField(f.key, e.target.value)}
                  />
                </div>
              ))}
              {readOnlyFields.map(f => (
                <div key={f.label}>
                  <label className="block text-muted-foreground mb-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {f.label}
                  </label>
                  <div className="groove-border bg-background px-2.5 py-1.5" style={FIELD_TEXT}>
                    {f.value || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Conversation */}
          <div className="flex-1 groove-border bg-card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-dashed border-border shrink-0 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span style={SECTION_TITLE}>Conversation History</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <MessageSquare className="w-12 h-12 text-muted-foreground" />
                  <p style={FIELD_TEXT} className="text-muted-foreground">No conversation history</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isHuman = msg.type === 'human';
                  return (
                    <div key={i} className={`flex ${isHuman ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] min-w-0 px-3 py-2 rounded text-sm overflow-hidden ${
                        isHuman ? 'bg-muted text-foreground groove-border' : 'bg-primary/20 text-foreground groove-border'
                      }`}>
                        <p className={`text-[11px] mb-1 capitalize ${isHuman ? 'text-foreground/70' : 'text-foreground/80'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {isHuman ? `${contact.first_name}` : 'Jessica'}
                          <span className="ml-2 text-foreground/50">
                            {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </p>
                        <p className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
