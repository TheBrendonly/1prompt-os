
export interface CsvRow {
  [key: string]: string;
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
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
};

export const parseCsvFile = (file: File): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        console.log('Raw CSV text length:', csvText.length);
        console.log('First 200 characters:', csvText.substring(0, 200));
        
        // Handle different line endings
        const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const rows = normalizedText.split('\n').filter(row => row.trim());
        
        console.log('Number of rows found:', rows.length);
        
        if (rows.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse header row
        const headers = parseCSVLine(rows[0]).map(header => 
          header.replace(/^["']|["']$/g, '').trim()
        );
        console.log('Headers found:', headers);
        
        const data: CsvRow[] = [];

        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVLine(rows[i]).map(value => 
            value.replace(/^["']|["']$/g, '').trim()
          );
          
          console.log(`Row ${i}:`, values);
          
          // Create row object even if column count doesn't match exactly
          const row: CsvRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Only skip completely empty rows
          if (Object.values(row).some(value => value.trim() !== '')) {
            data.push(row);
          }
        }

        console.log('Parsed CSV data:', data);
        console.log('Total data rows:', data.length);
        resolve(data);
      } catch (error) {
        console.error('CSV parsing error:', error);
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

// Filter out potentially sensitive data that might trigger authentication credential detection
export const sanitizeCsvData = (data: CsvRow[]): CsvRow[] => {
  // Keywords that indicate potentially sensitive authentication data
  const sensitiveKeywords = [
    'password', 'passwd', 'pwd', 'pass',
    'token', 'auth', 'secret', 'key', 'api',
    'credential', 'login', 'signin', 'authenticate',
    'session', 'cookie', 'bearer', 'oauth',
    'private', 'secure', 'confidential',
    'access_token', 'refresh_token', 'jwt',
    'authorization', 'basic', 'digest'
  ];
  
  return data.map(row => {
    const sanitizedRow: CsvRow = {};
    
    Object.keys(row).forEach(columnName => {
      // Check if column name contains sensitive keywords (case insensitive)
      const isColumnSensitive = sensitiveKeywords.some(keyword => 
        columnName.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!isColumnSensitive) {
        let value = row[columnName] || '';
        
        // Also sanitize the actual data values to remove potentially sensitive content
        const isValueSensitive = sensitiveKeywords.some(keyword => 
          value.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isValueSensitive) {
          // Replace sensitive content with a safe placeholder or remove it
          value = value.replace(new RegExp(sensitiveKeywords.join('|'), 'gi'), '[FILTERED]');
          
          // If the entire value becomes just filtered content, make it empty
          if (value.trim() === '[FILTERED]' || value.trim().match(/^\[FILTERED\][^a-zA-Z0-9]*$/)) {
            value = '';
          }
        }
        
        sanitizedRow[columnName] = value;
      }
    });
    
    return sanitizedRow;
  });
};

export const validateCsvData = (data: CsvRow[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('❌ CSV file contains no data rows. Please ensure your file has lead data.');
    return { isValid: false, errors };
  }

  // Check for maximum lead limit
  if (data.length > 10000) {
    errors.push(`❌ Too many leads: ${data.length.toLocaleString()}. Maximum allowed is 10,000 leads per campaign.`);
    return { isValid: false, errors };
  }

  // Required column names in exact order (must match template exactly)
  const requiredColumns = [
    'First Name',
    'Last Name', 
    'Email',
    'Phone',
    'Company',
    'Website',
    'Address',
    'Custom Value 1',
    'Custom Value 2',
    'Custom Value 3',
    'Custom Value 4',
    'Custom Value 5',
    'Custom Value 6',
    'Custom Value 7',
    'Custom Value 8',
    'Custom Value 9',
    'Custom Value 10'
  ];

  const actualColumns = Object.keys(data[0]);
  
  // Check if columns match exactly (strict validation)
  if (actualColumns.length !== requiredColumns.length) {
    errors.push(`❌ Column count mismatch: Found ${actualColumns.length} columns, expected ${requiredColumns.length}.`);
  }

  // Check if all required columns are present in exact order
  const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
  if (missingColumns.length > 0) {
    errors.push(`❌ Missing required columns: "${missingColumns.join('", "')}"`);
  }

  // Check for extra/unexpected columns
  const extraColumns = actualColumns.filter(col => !requiredColumns.includes(col));
  if (extraColumns.length > 0) {
    errors.push(`❌ Unexpected columns found: "${extraColumns.join('", "')}"`);
  }

  // If columns don't match exactly, show the expected format
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    errors.push(`📝 Please use the exact template format with these column names in order: "${requiredColumns.join('", "')}"`);
  }

  // Check for completely empty rows
  const emptyRows = data.filter(row => 
    Object.values(row).every(value => !value || !value.trim())
  ).length;
  
  if (emptyRows > 0) {
    errors.push(`⚠️ Found ${emptyRows} completely empty rows. These will be skipped.`);
  }

  // Check for rows missing essential data (email or phone)
  const incompleteRows = data.filter(row => {
    const email = row['Email']?.trim();
    const phone = row['Phone']?.trim();
    return !email && !phone;
  }).length;

  if (incompleteRows > 0) {
    errors.push(`⚠️ Found ${incompleteRows} rows without email or phone number. Each lead must have at least one contact method.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getLeadDisplayName = (leadData: CsvRow): string => {
  // With standardized format, we know the exact column names
  if (leadData['Email']) {
    return leadData['Email'];
  }
  
  if (leadData['First Name'] && leadData['Last Name']) {
    return `${leadData['First Name']} ${leadData['Last Name']}`.trim();
  }
  
  if (leadData['First Name']) {
    return leadData['First Name'];
  }
  
  if (leadData['Last Name']) {
    return leadData['Last Name'];
  }
  
  // Return first non-empty value as fallback
  const firstValue = Object.values(leadData).find(value => value && value.trim());
  return firstValue || 'Unknown Lead';
};
