import { useState, useCallback } from 'react';
import { FileStats } from '@/components/webinar/WebinarFileUpload';

export interface AttendeeRecord {
  attended: string;
  userName: string;
  email: string;
  joinTime: string;
  leaveTime: string;
  timeInSessionMinutes: number;
  isGuest: string;
  countryRegion: string;
}

export interface RegistrantRecord {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
}

export interface CRMContact {
  contactId: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  created: string;
  lastActivity: string;
  tags: string;
}

export interface ParsedAttendedReport {
  reportGeneratedTime: string;
  webinarInfo: {
    topic: string;
    webinarId: string;
    actualStartTime: string;
    actualDurationMinutes: number;
    uniqueViewers: number;
    totalUsers: number;
  };
  attendees: AttendeeRecord[];
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const useWebinarFileParser = () => {
  // Attended Report State
  const [attendedFile, setAttendedFile] = useState<File | null>(null);
  const [attendedData, setAttendedData] = useState<ParsedAttendedReport | null>(null);
  const [attendedStats, setAttendedStats] = useState<FileStats | null>(null);
  const [attendedError, setAttendedError] = useState<string | null>(null);
  const [attendedDragOver, setAttendedDragOver] = useState(false);

  // Unattended Report State
  const [unattendedFile, setUnattendedFile] = useState<File | null>(null);
  const [unattendedData, setUnattendedData] = useState<RegistrantRecord[]>([]);
  const [unattendedStats, setUnattendedStats] = useState<FileStats | null>(null);
  const [unattendedError, setUnattendedError] = useState<string | null>(null);
  const [unattendedDragOver, setUnattendedDragOver] = useState(false);

  // CRM Report State
  const [crmFile, setCrmFile] = useState<File | null>(null);
  const [crmData, setCrmData] = useState<CRMContact[]>([]);
  const [crmStats, setCrmStats] = useState<FileStats | null>(null);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [crmDragOver, setCrmDragOver] = useState(false);

  // Parse Attended Report (Zoom format)
  const parseAttendedReport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 4 || !lines[0].includes('Attendee Report')) {
        throw new Error('Invalid Zoom Attendee Report format');
      }

      const reportTimeLine = lines[1];
      const reportGeneratedTime = reportTimeLine.split(',')[1]?.trim() || '';

      const webinarValues = parseCSVLine(lines[3]);
      
      const webinarInfo = {
        topic: webinarValues[0] || '',
        webinarId: webinarValues[1] || '',
        actualStartTime: webinarValues[2] || '',
        actualDurationMinutes: parseInt(webinarValues[3]) || 0,
        uniqueViewers: parseInt(webinarValues[4]) || 0,
        totalUsers: parseInt(webinarValues[5]) || 0,
      };

      const attendeeDetailsIndex = lines.findIndex(line => line.includes('Attendee Details'));
      const attendees: AttendeeRecord[] = [];
      
      if (attendeeDetailsIndex !== -1) {
        for (let i = attendeeDetailsIndex + 2; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length >= 7 && values[0]) {
            attendees.push({
              attended: values[0] || '',
              userName: values[1] || '',
              email: values[2] || '',
              joinTime: values[3] || '',
              leaveTime: values[4] || '',
              timeInSessionMinutes: parseInt(values[5]) || 0,
              isGuest: values[6] || '',
              countryRegion: values[7] || ''
            });
          }
        }
      }

      // Consolidate attendees
      const consolidatedMap = new Map<string, AttendeeRecord>();
      attendees.forEach(attendee => {
        const key = (attendee.email?.trim() || attendee.userName?.trim() || '').toLowerCase();
        if (!key) return;
        
        const existing = consolidatedMap.get(key);
        if (!existing) {
          consolidatedMap.set(key, { ...attendee });
        } else {
          existing.timeInSessionMinutes += attendee.timeInSessionMinutes;
        }
      });
      
      const consolidatedAttendees = Array.from(consolidatedMap.values());

      const parsedData = {
        reportGeneratedTime,
        webinarInfo,
        attendees: consolidatedAttendees
      };

      // Calculate stats
      const totalTime = consolidatedAttendees.reduce((sum, a) => sum + a.timeInSessionMinutes, 0);
      const emailCount = consolidatedAttendees.filter(a => a.email?.trim()).length;
      const countries = new Set(consolidatedAttendees.map(a => a.countryRegion).filter(Boolean));
      const guestCount = consolidatedAttendees.filter(a => a.isGuest === 'Yes').length;

      const stats: FileStats = {
        totalPeople: consolidatedAttendees.length,
        emailCount,
        totalHours: totalTime / 60,
        avgTimeMinutes: consolidatedAttendees.length > 0 ? Math.round(totalTime / consolidatedAttendees.length) : 0,
        uniqueCountries: countries.size,
        guestCount,
        peopleLabel: 'Attendees'
      };

      setAttendedFile(file);
      setAttendedData(parsedData);
      setAttendedStats(stats);
      setAttendedError(null);
    } catch (error: any) {
      setAttendedError(error.message || 'Failed to parse file');
      setAttendedData(null);
      setAttendedStats(null);
    }
  }, []);

  // Parse Unattended Report (Registrants who didn't attend - has emails)
  const parseUnattendedReport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      // Find header row
      let headerIndex = lines.findIndex(line => 
        line.toLowerCase().includes('email') || 
        line.toLowerCase().includes('first name')
      );
      
      if (headerIndex === -1) headerIndex = 0;
      
      const headers = parseCSVLine(lines[headerIndex]).map(h => h.toLowerCase().trim());
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const firstNameIdx = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIdx = headers.findIndex(h => h.includes('last') && h.includes('name'));
      const userNameIdx = headers.findIndex(h => h.includes('user') && h.includes('name'));

      const registrants: RegistrantRecord[] = [];
      
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 1) {
          registrants.push({
            email: emailIdx >= 0 ? values[emailIdx]?.trim() || '' : '',
            firstName: firstNameIdx >= 0 ? values[firstNameIdx]?.trim() || '' : '',
            lastName: lastNameIdx >= 0 ? values[lastNameIdx]?.trim() || '' : '',
            userName: userNameIdx >= 0 ? values[userNameIdx]?.trim() || '' : ''
          });
        }
      }

      // Filter out empty entries
      const validRegistrants = registrants.filter(r => r.email || r.firstName || r.lastName);
      const emailCount = validRegistrants.filter(r => r.email?.trim()).length;

      const stats: FileStats = {
        totalPeople: validRegistrants.length,
        emailCount,
        peopleLabel: 'Unattended People'
      };

      setUnattendedFile(file);
      setUnattendedData(validRegistrants);
      setUnattendedStats(stats);
      setUnattendedError(null);
    } catch (error: any) {
      setUnattendedError(error.message || 'Failed to parse file');
      setUnattendedData([]);
      setUnattendedStats(null);
    }
  }, []);

  // Parse CRM Report (GHL export)
  const parseCRMReport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      const contactIdIdx = headers.findIndex(h => h.includes('contact') && h.includes('id'));
      const firstNameIdx = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIdx = headers.findIndex(h => h.includes('last') && h.includes('name'));
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const createdIdx = headers.findIndex(h => h.includes('created'));
      const lastActivityIdx = headers.findIndex(h => h.includes('last') && h.includes('activity'));
      const tagsIdx = headers.findIndex(h => h.includes('tags'));

      const contacts: CRMContact[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 1) {
          const firstName = firstNameIdx >= 0 ? values[firstNameIdx]?.trim() || '' : '';
          const lastName = lastNameIdx >= 0 ? values[lastNameIdx]?.trim() || '' : '';
          const fullName = nameIdx >= 0 ? values[nameIdx]?.trim() || '' : `${firstName} ${lastName}`.trim();
          
          contacts.push({
            contactId: contactIdIdx >= 0 ? values[contactIdIdx]?.trim() || `id_${i}` : `id_${i}`,
            firstName,
            lastName,
            name: fullName,
            email: emailIdx >= 0 ? values[emailIdx]?.trim() || '' : '',
            phone: phoneIdx >= 0 ? values[phoneIdx]?.trim() || '' : '',
            created: createdIdx >= 0 ? values[createdIdx]?.trim() || '' : '',
            lastActivity: lastActivityIdx >= 0 ? values[lastActivityIdx]?.trim() || '' : '',
            tags: tagsIdx >= 0 ? values[tagsIdx]?.trim() || '' : ''
          });
        }
      }

      // Filter out empty entries
      const validContacts = contacts.filter(c => c.email || c.name || c.phone);
      const emailCount = validContacts.filter(c => c.email?.trim()).length;
      const phoneCount = validContacts.filter(c => c.phone?.trim()).length;

      const stats: FileStats = {
        totalPeople: validContacts.length,
        emailCount,
        phoneCount,
        peopleLabel: 'CRM Contacts'
      };

      setCrmFile(file);
      setCrmData(validContacts);
      setCrmStats(stats);
      setCrmError(null);
    } catch (error: any) {
      setCrmError(error.message || 'Failed to parse file');
      setCrmData([]);
      setCrmStats(null);
    }
  }, []);

  // Reset functions
  const resetAttended = useCallback(() => {
    setAttendedFile(null);
    setAttendedData(null);
    setAttendedStats(null);
    setAttendedError(null);
  }, []);

  const resetUnattended = useCallback(() => {
    setUnattendedFile(null);
    setUnattendedData([]);
    setUnattendedStats(null);
    setUnattendedError(null);
  }, []);

  const resetCRM = useCallback(() => {
    setCrmFile(null);
    setCrmData([]);
    setCrmStats(null);
    setCrmError(null);
  }, []);

  const resetAll = useCallback(() => {
    resetAttended();
    resetUnattended();
    resetCRM();
  }, [resetAttended, resetUnattended, resetCRM]);

  return {
    // Attended
    attendedFile,
    attendedData,
    attendedStats,
    attendedError,
    attendedDragOver,
    setAttendedDragOver,
    parseAttendedReport,
    resetAttended,
    
    // Unattended
    unattendedFile,
    unattendedData,
    unattendedStats,
    unattendedError,
    unattendedDragOver,
    setUnattendedDragOver,
    parseUnattendedReport,
    resetUnattended,
    
    // CRM
    crmFile,
    crmData,
    crmStats,
    crmError,
    crmDragOver,
    setCrmDragOver,
    parseCRMReport,
    resetCRM,
    
    // Reset all
    resetAll
  };
};
