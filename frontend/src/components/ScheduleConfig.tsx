
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from '@/components/icons';

interface ScheduleData {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  batchSize: number;
  batchIntervalMinutes: number;
  leadDelaySeconds: number;
}

interface ScheduleConfigProps {
  onScheduleChange: (schedule: ScheduleData) => void;
}

const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ onScheduleChange }) => {
  const [schedule, setSchedule] = useState<ScheduleData>({
    daysOfWeek: [2, 3, 4, 5, 6], // Tue-Sat by default
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York',
    batchSize: 10,
    batchIntervalMinutes: 15,
    leadDelaySeconds: 5,
  });

  const daysOptions = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
  ];

  const toggleDay = (day: number) => {
    const newDays = schedule.daysOfWeek.includes(day)
      ? schedule.daysOfWeek.filter(d => d !== day)
      : [...schedule.daysOfWeek, day].sort();
    
    const newSchedule = { ...schedule, daysOfWeek: newDays };
    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  const updateSchedule = (field: keyof ScheduleData, value: any) => {
    const newSchedule = { ...schedule, [field]: value };
    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  return (
    <div className="material-surface p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">Schedule Configuration</h2>
        </div>
        <p className="text-on-surface-variant">Set up your drip campaign timing and batch settings</p>
      </div>

      <div className="space-y-6">
        {/* Days of Week */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-on-surface">Active Days</Label>
          <div className="flex flex-wrap gap-2">
            {daysOptions.map((day) => (
              <Button
                key={day.value}
                type="button"
                variant={schedule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 ${
                  schedule.daysOfWeek.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-on-surface border-outline'
                }`}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Time Window */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Time Window (Eastern Timezone)
            </Label>
            <p className="text-xs text-muted-foreground">All times are in Eastern Time (ET). This ensures consistent scheduling across your campaigns.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="start-time" className="text-sm font-medium text-foreground">
                Start Time
              </Label>
              <div className="relative">
                <Input
                  id="start-time"
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule('startTime', e.target.value)}
                  className="h-10 text-base font-mono tracking-wider text-center border-2 focus:border-primary/50 bg-muted/30"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="end-time" className="text-sm font-medium text-foreground">
                End Time
              </Label>
              <div className="relative">
                <Input
                  id="end-time"
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => updateSchedule('endTime', e.target.value)}
                  className="h-10 text-base font-mono tracking-wider text-center border-2 focus:border-primary/50 bg-muted/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Batch Settings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">Batch Configuration</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="batch-size" className="text-sm font-medium text-foreground">
                Batch Size
              </Label>
              <Input
                id="batch-size"
                type="number"
                min="1"
                max="100"
                value={schedule.batchSize}
                onChange={(e) => updateSchedule('batchSize', parseInt(e.target.value))}
                className="text-base font-mono"
              />
              <p className="text-xs text-muted-foreground">Leads per batch</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-interval" className="text-sm font-medium text-foreground">
                Batch Interval
              </Label>
              <Input
                id="batch-interval"
                type="number"
                min="1"
                max="60"
                value={schedule.batchIntervalMinutes}
                onChange={(e) => updateSchedule('batchIntervalMinutes', parseInt(e.target.value))}
                className="text-base font-mono"
              />
              <p className="text-xs text-muted-foreground">Minutes between batches</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-delay" className="text-sm font-medium text-foreground">
                Lead Delay
              </Label>
              <Input
                id="lead-delay"
                type="number"
                min="1"
                max="30"
                value={schedule.leadDelaySeconds}
                onChange={(e) => updateSchedule('leadDelaySeconds', parseInt(e.target.value))}
                className="text-base font-mono"
              />
              <p className="text-xs text-muted-foreground">Seconds between leads</p>
            </div>
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="material-surface-variant p-4 rounded-lg">
          <h4 className="font-medium text-on-surface mb-2">Schedule Preview</h4>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>
              <span className="font-medium">Active Days:</span>{' '}
              {schedule.daysOfWeek.map(d => daysOptions.find(opt => opt.value === d)?.label).join(', ')}
            </p>
            <p>
              <span className="font-medium">Time Window:</span>{' '}
              {schedule.startTime} - {schedule.endTime} (Eastern Time)
            </p>
            <p>
              <span className="font-medium">Processing:</span>{' '}
              {schedule.batchSize} leads every {schedule.batchIntervalMinutes} minutes, {schedule.leadDelaySeconds}s delay between leads
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConfig;
