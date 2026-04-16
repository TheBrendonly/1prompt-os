import { format, formatDistanceToNow, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const EASTERN_TIMEZONE = 'America/New_York';

export function formatLeadTime(dateString: string | null): string {
  if (!dateString) return 'Not scheduled';

  try {
    const date = new Date(dateString);
    
    // Convert to Eastern timezone
    const easternTime = toZonedTime(date, EASTERN_TIMEZONE);
    
    // Format the date and time
    const formattedDate = format(easternTime, 'MMM dd, yyyy');
    const formattedTime = format(easternTime, 'h:mm a');
    
    // Calculate time ago
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    
    return `${formattedDate} at ${formattedTime} (${timeAgo})`;
  } catch (error) {
    console.error('Error formatting lead time:', error);
    return 'Invalid date';
  }
}

export function formatScheduledTime(dateString: string | null): string {
  if (!dateString) return 'Not scheduled';

  try {
    const date = new Date(dateString);
    
    // Convert to Eastern timezone
    const easternTime = toZonedTime(date, EASTERN_TIMEZONE);
    
    // Format the date and time
    const formattedDate = format(easternTime, 'MMM dd');
    const formattedTime = format(easternTime, 'h:mm a');
    
    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting scheduled time:', error);
    return 'Invalid date';
  }
}

// Check if a date is within business hours
function isWithinBusinessHours(date: Date, startTime: string, endTime: string, daysOfWeek: number[], timezone: string): boolean {
  const zonedTime = toZonedTime(date, timezone);
  const currentHour = zonedTime.getHours();
  const currentMinute = zonedTime.getMinutes();
  const currentDay = zonedTime.getDay();
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  // Check if current day is in allowed days
  if (!daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  // Handle overnight schedule (e.g., 22:00 - 06:00)
  if (startTimeInMinutes > endTimeInMinutes) {
    return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
  }
  
  // Normal schedule (e.g., 09:00 - 17:00)
  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
}

// Get the next valid time slot based on business hours
export function getNextValidTime(
  currentTime: Date,
  startTime: string,
  endTime: string,
  daysOfWeek: number[],
  timezone: string
): Date | null {
  if (isWithinBusinessHours(currentTime, startTime, endTime, daysOfWeek, timezone)) {
    return null; // Already within business hours
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  let nextValidTime = new Date(currentTime);
  
  // Try the next 14 days to find a valid time
  for (let i = 0; i < 14; i++) {
    const checkDate = addDays(nextValidTime, i);
    const zonedCheckDate = toZonedTime(checkDate, timezone);
    
    if (daysOfWeek.includes(zonedCheckDate.getDay())) {
      // Set to start of business hours
      const validTime = new Date(zonedCheckDate);
      validTime.setHours(startHour, startMinute, 0, 0);
      
      // Convert back from timezone to UTC
      const utcValidTime = fromZonedTime(validTime, timezone);
      
      if (utcValidTime > currentTime) {
        return utcValidTime;
      }
    }
  }
  
  return null; // No valid time found in next 14 days
};