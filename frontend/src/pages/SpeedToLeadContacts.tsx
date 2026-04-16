import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from '@/components/icons';
import { getContacts, type DemoContact } from '@/data/speedToLeadData';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

const FIELD_TEXT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' };

export default function SpeedToLeadContacts() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const allContacts = useMemo(() => getContacts(), []);

  const [search, setSearch] = useState('');
  const [approachFilter, setApproachFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [replyFilter, setReplyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return allContacts.filter(c => {
      if (approachFilter !== 'all' && c.approach !== approachFilter) return false;
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (replyFilter === 'replied' && !c.replied) return false;
      if (replyFilter === 'no-reply' && c.replied) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${c.first_name} ${c.last_name}`.toLowerCase();
        return name.includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allContacts, search, approachFilter, channelFilter, replyFilter]);

  const pageContacts = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

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

  return (
    <div className="space-y-4 pb-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={approachFilter} onValueChange={v => { setApproachFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Approach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Approaches</SelectItem>
            <SelectItem value="enhanced">Enhanced</SelectItem>
            <SelectItem value="legacy">Legacy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={v => { setChannelFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="imessage">iMessage</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={replyFilter} onValueChange={v => { setReplyFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="no-reply">No Reply</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="groove-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={FIELD_TEXT}>Lead Name</TableHead>
              <TableHead style={FIELD_TEXT}>Phone</TableHead>
              <TableHead style={FIELD_TEXT}>Email</TableHead>
              <TableHead style={FIELD_TEXT}>City</TableHead>
              <TableHead style={FIELD_TEXT}>Service Interest</TableHead>
              <TableHead style={FIELD_TEXT}>Created</TableHead>
              <TableHead style={FIELD_TEXT}>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageContacts.map(c => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => navigate(`/client/${clientId}/speed-to-lead/contacts/${c.id}`)}
              >
                <TableCell style={FIELD_TEXT} className="font-medium">{c.first_name} {c.last_name}</TableCell>
                <TableCell style={FIELD_TEXT}>{c.phone}</TableCell>
                <TableCell style={FIELD_TEXT}>{c.email}</TableCell>
                <TableCell style={FIELD_TEXT}>{c.city}, {c.state}</TableCell>
                <TableCell style={FIELD_TEXT}>{c.service_interest}</TableCell>
                <TableCell style={FIELD_TEXT}>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map(tag => (
                      <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border rounded-sm ${tagColor(tag)}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p style={FIELD_TEXT} className="text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 groove-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span style={FIELD_TEXT} className="text-muted-foreground">{page + 1}/{totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 groove-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
