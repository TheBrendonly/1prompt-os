import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, Users, Clock, Mail, Phone, Globe } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface FileStats {
  totalPeople: number;
  emailCount: number;
  phoneCount?: number;
  totalHours?: number;
  avgTimeMinutes?: number;
  uniqueCountries?: number;
  guestCount?: number;
  // Additional fields for descriptive labels
  peopleLabel?: string; // e.g., "Unattended People" or "Attendees"
}

interface WebinarFileUploadProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  file: File | null;
  stats: FileStats | null;
  error: string | null;
  isDragOver: boolean;
  colorScheme: 'blue' | 'orange' | 'green';
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  inputId: string;
  showTimeStats?: boolean;
}

const colorClasses = {
  blue: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'from-blue-500/10 to-blue-600/5',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  orange: {
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'from-orange-500/10 to-orange-600/5',
    icon: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  green: {
    border: 'border-green-200 dark:border-green-800',
    bg: 'from-green-500/10 to-green-600/5',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

export const WebinarFileUpload: React.FC<WebinarFileUploadProps> = ({
  title,
  description,
  icon,
  file,
  stats,
  error,
  isDragOver,
  colorScheme,
  onFileSelect,
  onRemove,
  onDragOver,
  onDragLeave,
  onDrop,
  inputId,
  showTimeStats = false,
}) => {
  const colors = colorClasses[colorScheme];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card className={cn("border-2", colors.border, `bg-gradient-to-br ${colors.bg}`)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2 text-base", colors.text)}>
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer",
            isDragOver && "border-primary bg-primary/5",
            file && !error && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
            error && "border-destructive bg-destructive/10",
            !file && !isDragOver && "border-border hover:border-primary/50"
          )}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <input
            type="file"
            id={inputId}
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              {error ? (
                <>
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
                  <p className="text-xs font-medium text-destructive">{error}</p>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-xs font-medium text-foreground">Drop CSV here</p>
              <p className="text-[10px] text-muted-foreground">or click to browse</p>
            </div>
          )}
        </div>

        {/* Stats Display */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
              <Users className={cn("h-4 w-4", colors.icon)} />
              <div>
                <p className={cn("text-lg font-bold", colors.text)}>{stats.totalPeople}</p>
                <p className="text-[10px] text-muted-foreground">{stats.peopleLabel || 'Total People'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
              <Mail className={cn("h-4 w-4", colors.icon)} />
              <div>
                <p className={cn("text-lg font-bold", colors.text)}>{stats.emailCount}</p>
                <p className="text-[10px] text-muted-foreground">Emails</p>
              </div>
            </div>

            {stats.phoneCount !== undefined && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <Phone className={cn("h-4 w-4", colors.icon)} />
                <div>
                  <p className={cn("text-lg font-bold", colors.text)}>{stats.phoneCount}</p>
                  <p className="text-[10px] text-muted-foreground">Phone Numbers</p>
                </div>
              </div>
            )}

            {showTimeStats && stats.totalHours !== undefined && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <Clock className={cn("h-4 w-4", colors.icon)} />
                <div>
                  <p className={cn("text-lg font-bold", colors.text)}>{stats.totalHours.toFixed(1)}h</p>
                  <p className="text-[10px] text-muted-foreground">Total Hours</p>
                </div>
              </div>
            )}

            {showTimeStats && stats.avgTimeMinutes !== undefined && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <Clock className={cn("h-4 w-4", colors.icon)} />
                <div>
                  <p className={cn("text-lg font-bold", colors.text)}>{stats.avgTimeMinutes}m</p>
                  <p className="text-[10px] text-muted-foreground">Avg Time</p>
                </div>
              </div>
            )}

            {stats.uniqueCountries !== undefined && stats.uniqueCountries > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <Globe className={cn("h-4 w-4", colors.icon)} />
                <div>
                  <p className={cn("text-lg font-bold", colors.text)}>{stats.uniqueCountries}</p>
                  <p className="text-[10px] text-muted-foreground">Countries</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
