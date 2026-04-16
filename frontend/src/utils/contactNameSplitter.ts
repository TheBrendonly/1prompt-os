/**
 * Splits a full contact name into first and last name.
 * "Harsh Agrawal" → { firstName: "Harsh", lastName: "Agrawal" }
 * "John Michael Smith" → { firstName: "John", lastName: "Michael Smith" }
 * "Harsh" → { firstName: "Harsh", lastName: "" }
 */
export function splitContactName(name: string): { firstName: string; lastName: string } {
  const trimmed = (name || '').trim();
  if (!trimmed || trimmed === 'null') return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Given a contact_data object, auto-populate first_name and last_name
 * from contact_name if they are empty. Returns updated data or null if no changes needed.
 */
export function autoSplitContactName(contactData: Record<string, string>): Record<string, string> | null {
  const clean = (val: string | undefined) => (!val || val === 'null') ? '' : val.trim();

  // Find the full name from various possible keys
  const fullName = clean(contactData['contact_name']) || clean(contactData['name']) || clean(contactData['Name']) || clean(contactData['full_name']) || clean(contactData['fullName']);
  if (!fullName) return null;

  // Check if first_name/last_name are already populated
  const hasFirst = !!(clean(contactData['first_name']) || clean(contactData['First Name']) || clean(contactData['firstName']));
  const hasLast = !!(clean(contactData['last_name']) || clean(contactData['Last Name']) || clean(contactData['lastName']));

  if (hasFirst && hasLast) return null; // Already populated

  const { firstName, lastName } = splitContactName(fullName);
  const updated = { ...contactData };

  if (!hasFirst && firstName) updated['first_name'] = firstName;
  if (!hasLast && lastName) updated['last_name'] = lastName;

  // Check if anything actually changed
  if (updated['first_name'] === contactData['first_name'] && updated['last_name'] === contactData['last_name']) {
    return null;
  }

  return updated;
}
