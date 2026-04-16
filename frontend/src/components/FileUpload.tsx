
import React, { useCallback, useState } from 'react';
import { Upload, File, CheckCircle, Download, Info } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const downloadTemplate = () => {
    const csvContent = 'First Name,Last Name,Email,Phone,Company,Website,Address,Custom Value 1,Custom Value 2,Custom Value 3,Custom Value 4,Custom Value 5,Custom Value 6,Custom Value 7,Custom Value 8,Custom Value 9,Custom Value 10\nJohn,Doe,john.doe@example.com,555-123-4567,Acme Corp,https://acme.com,"123 Main St, City, State 12345",Sample Data 1,Sample Data 2,,,,,,,,,';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      onFileSelect(csvFile);
    }
  }, [onFileSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="bg-surface p-8 animate-fade-in shadow-elevation-1 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-on-surface mb-2">Upload Lead Database</h2>
        <p className="text-on-surface-variant">Select your CSV file containing the leads to reactivate</p>
      </div>

      <Alert className="mb-6 bg-card border-outline shadow-sm">
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <p className="font-medium">Required CSV Format:</p>
            </div>
            <p className="text-sm">Your CSV must have these exact column names in order:</p>
            <code className="block text-xs bg-background p-3 rounded-md mt-2 border border-outline">
              First Name, Last Name, Email, Phone, Company, Website, Address, Custom Value 1-10
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2 mt-3 bg-card hover:bg-accent border-outline"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div
        className={`
          border-2 border-dashed p-12 text-center transition-all duration-200
          ${isDragOver ? 'border-primary bg-accent' : 'border-outline'}
          ${selectedFile ? 'border-primary bg-accent/50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-primary mb-4" />
            <div className="flex items-center mb-2">
              <File className="w-5 h-5 text-primary mr-2" />
              <span className="font-medium text-on-surface">{selectedFile.name}</span>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              className="material-button-secondary"
            >
              Choose Different File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-on-surface mb-2">
              Drop your CSV file here
            </p>
            <p className="text-on-surface-variant mb-6">
              or click to browse files
            </p>
            <Button
              onClick={() => document.getElementById('file-input')?.click()}
              className="material-button-primary px-6 py-2"
            >
              Select CSV File
            </Button>
          </div>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
