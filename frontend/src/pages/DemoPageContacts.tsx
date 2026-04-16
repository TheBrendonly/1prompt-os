import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, MessageSquare, Trash2, Phone } from '@/components/icons';
import { format } from 'date-fns';

interface DemoPageContact {
  id: string;
  client_id: string;
  name: string;
  phone_number: string;
  notes: string | null;
  created_at: string;
}

export default function DemoPageContacts() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<DemoPageContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone_number: '', notes: '' });
  const [saving, setSaving] = useState(false);

  usePageHeader({
    title: 'SMS Contacts',
    actions: [{
      label: 'ADD CONTACT',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => setShowAddDialog(true),
    }],
  });

  useEffect(() => {
    if (clientId) fetchContacts();
  }, [clientId]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_page_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts((data || []) as unknown as DemoPageContact[]);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({ title: 'Error', description: 'Failed to fetch contacts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!clientId || !newContact.name.trim() || !newContact.phone_number.trim()) {
      toast({ title: 'Error', description: 'Name and phone number are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('demo_page_contacts')
        .insert({
          client_id: clientId,
          name: newContact.name.trim(),
          phone_number: newContact.phone_number.trim(),
          notes: newContact.notes.trim() || null,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Contact added successfully' });
      setShowAddDialog(false);
      setNewContact({ name: '', phone_number: '', notes: '' });
      fetchContacts();
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({ title: 'Error', description: 'Failed to add contact', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('demo_page_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Contact deleted' });
      fetchContacts();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
    }
  };

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone_number.includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl py-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No SMS Contacts</h3>
              <p className="text-muted-foreground mb-4">
                Add contacts to start sending and receiving SMS via Twilio
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(contact => (
                  <TableRow key={contact.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell
                      className="font-medium"
                      onClick={() => navigate(`/client/${clientId}/sms-contacts/${contact.id}`)}
                    >
                      {contact.name}
                    </TableCell>
                    <TableCell
                      className="font-mono text-sm"
                      onClick={() => navigate(`/client/${clientId}/sms-contacts/${contact.id}`)}
                    >
                      {contact.phone_number}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm max-w-[200px] truncate"
                      onClick={() => navigate(`/client/${clientId}/sms-contacts/${contact.id}`)}
                    >
                      {contact.notes || '—'}
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      onClick={() => navigate(`/client/${clientId}/sms-contacts/${contact.id}`)}
                    >
                      {format(new Date(contact.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/client/${clientId}/sms-contacts/${contact.id}`)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SMS Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="John Doe"
                value={newContact.name}
                onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+15551234567"
                value={newContact.phone_number}
                onChange={e => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">E.164 format (e.g. +15551234567)</p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes about this contact..."
                value={newContact.notes}
                onChange={e => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddContact} disabled={saving}>
              {saving ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
