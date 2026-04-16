/**
 * Phone number validation utilities using libphonenumber-js.
 */
import { parsePhoneNumber } from 'libphonenumber-js';

export type PhoneFormatStatus = 'valid' | 'auto-fixed' | 'warning' | 'invalid' | 'empty';

export interface PhoneValidationResult {
  status: PhoneFormatStatus;
  normalized: string;
  message?: string;
}

/** Validate and normalize a phone number */
export function validatePhone(raw: string | null | undefined): PhoneValidationResult {
  if (!raw || !raw.trim()) return { status: 'empty', normalized: '' };

  const cleaned = raw.replace(/[\s\-.()\u00A0]/g, '');
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

  // Try to parse and format nicely, but always accept the number
  try {
    const parsed = parsePhoneNumber(withPlus);
    return { status: 'valid', normalized: parsed.format('E.164') };
  } catch {
    // Could not parse — still keep it with + prefix
    return { status: 'valid', normalized: withPlus };
  }
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
