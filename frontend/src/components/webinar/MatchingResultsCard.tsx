import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Users, Mail, Phone, Target, Search, Download } from '@/components/icons';

export interface MatchedContact {
  userName: string;
  attended: boolean;
  joinTime?: string;
  leaveTime?: string;
  timeInSessionMinutes: number;
  country: string;
  registrationEmail?: string;
  registrationFirstName?: string;
  registrationLastName?: string;
  contactId?: string;
  crmFirstName?: string;
  crmLastName?: string;
  crmEmail?: string;
  crmPhone?: string;
  crmTags?: string;
  matchConfidence: 'high' | 'medium' | 'low' | 'unmatched';
  matchMethod?: string;
}

interface MatchingStats {
  totalAttendees: number;
  totalNonAttendees: number;
  totalGHLContacts: number;
  filteredCRMContacts: number;
  matchedHigh: number;
  matchedMedium: number;
  matchedLow: number;
  unmatched: number;
  withPhoneCount: number;
  withEmailCount: number;
}

interface MatchingResultsCardProps {
  matchedContacts: MatchedContact[];
  stats: MatchingStats;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
}

const confidenceBadgeStyles: Record<string, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  unmatched: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const MatchingResultsCard: React.FC<MatchingResultsCardProps> = ({
  matchedContacts,
  stats,
  searchQuery,
  onSearchChange,
  onExport,
}) => {
  const filteredContacts = matchedContacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.userName?.toLowerCase().includes(query) ||
      contact.crmEmail?.toLowerCase().includes(query) ||
      contact.crmPhone?.toLowerCase().includes(query) ||
      contact.crmFirstName?.toLowerCase().includes(query) ||
      contact.crmLastName?.toLowerCase().includes(query)
    );
  });

  const matchRate = stats.totalAttendees > 0 
    ? Math.round(((stats.matchedHigh + stats.matchedMedium + stats.matchedLow) / stats.totalAttendees) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalAttendees}</p>
            <p className="text-xs text-blue-600/80">Attendees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{matchRate}%</p>
            <p className="text-xs text-green-600/80">Match Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.withEmailCount}</p>
            <p className="text-xs text-purple-600/80">With Email</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4 text-center">
            <Phone className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.withPhoneCount}</p>
            <p className="text-xs text-cyan-600/80">With Phone</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.unmatched}</p>
            <p className="text-xs text-red-600/80">Unmatched</p>
          </CardContent>
        </Card>
      </div>

      {/* Match Breakdown */}
      <div className="flex flex-wrap gap-2">
        <Badge className={confidenceBadgeStyles.high}>
          <CheckCircle className="h-3 w-3 mr-1" />
          High: {stats.matchedHigh}
        </Badge>
        <Badge className={confidenceBadgeStyles.medium}>
          Medium: {stats.matchedMedium}
        </Badge>
        <Badge className={confidenceBadgeStyles.low}>
          Low: {stats.matchedLow}
        </Badge>
        <Badge className={confidenceBadgeStyles.unmatched}>
          Unmatched: {stats.unmatched}
        </Badge>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Matched Contacts
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          <CardDescription>
            Showing {filteredContacts.length} of {matchedContacts.length} matched contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Webinar Name</TableHead>
                  <TableHead>CRM Email</TableHead>
                  <TableHead>CRM Phone</TableHead>
                  <TableHead>Time (min)</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead>Match Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact, index) => (
                  <TableRow key={`${contact.userName}-${index}`}>
                    <TableCell className="font-medium">
                      {contact.userName || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.crmEmail || (
                        <span className="text-muted-foreground italic">No email</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.crmPhone || (
                        <span className="text-muted-foreground italic">No phone</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {contact.timeInSessionMinutes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={confidenceBadgeStyles[contact.matchConfidence]}>
                        {contact.matchConfidence}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {contact.matchMethod || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No contacts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
