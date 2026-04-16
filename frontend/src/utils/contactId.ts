export type ContactDataRecord = Record<string, string>;

export interface ContactTag {
  name: string;
  color: string;
}

export interface ExternalContactSyncPayload {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  custom_fields: Record<string, string>;
  tags: ContactTag[];
}

type ContactLike = {
  id?: string | null;
  lead_id?: string | null;
  custom_fields?: Record<string, unknown> | null;
  tags?: ContactTag[] | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
};

export const STANDARD_CONTACT_COLUMN_KEYS = new Set([
  'first_name',
  'last_name',
  'email',
  'phone',
  'business_name',
]);

export const RESERVED_CONTACT_KEYS = new Set([
  'id',
  'lead_id',
  'session_id',
  'created_at',
  'updated_at',
  'custom_fields',
  'tags',
  'client_id',
]);

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).trim();
};

const toNullableString = (value: unknown): string | null => {
  const text = stringifyValue(value);
  return text || null;
};

const setIfPresent = (target: ContactDataRecord, key: string, value: unknown) => {
  const text = stringifyValue(value);
  if (text) {
    target[key] = text;
  }
};

export const cleanContactId = (value: unknown): string => stringifyValue(value);

export const createCanonicalLeadId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getCanonicalLeadId = (contact: ContactLike | null | undefined): string => {
  if (!contact) return '';

  return (
    cleanContactId(contact.lead_id) ||
    cleanContactId(contact.id)
  );
};

export const buildEditableContactData = (contact: ContactLike | null | undefined): ContactDataRecord => {
  if (!contact) return {};

  const merged: ContactDataRecord = {};

  setIfPresent(merged, 'first_name', contact.first_name);
  setIfPresent(merged, 'last_name', contact.last_name);
  setIfPresent(merged, 'email', contact.email);
  setIfPresent(merged, 'phone', contact.phone);
  setIfPresent(merged, 'business_name', contact.business_name);

  Object.entries(contact.custom_fields || {}).forEach(([key, value]) => {
    if (RESERVED_CONTACT_KEYS.has(key) || STANDARD_CONTACT_COLUMN_KEYS.has(key)) return;
    setIfPresent(merged, key, value);
  });

  return merged;
};

export const buildCustomFieldsFromData = (data: Record<string, unknown>): Record<string, string> => {
  const customFields: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (STANDARD_CONTACT_COLUMN_KEYS.has(key) || RESERVED_CONTACT_KEYS.has(key)) return;
    const text = stringifyValue(value);
    if (text) {
      customFields[key] = text;
    }
  });

  return customFields;
};

export const buildExternalContactSyncPayload = (
  data: Record<string, unknown>,
  options: {
    customFields?: Record<string, string>;
    tags?: ContactTag[] | null;
  } = {}
): ExternalContactSyncPayload => {
  const customFields = options.customFields ?? buildCustomFieldsFromData(data);

  return {
    first_name: toNullableString(data.first_name),
    last_name: toNullableString(data.last_name),
    email: toNullableString(data.email),
    phone: toNullableString(data.phone),
    business_name: toNullableString(data.business_name),
    custom_fields: customFields,
    tags: Array.isArray(options.tags) ? options.tags : [],
  };
};
