import { Timestamp } from 'firebase/firestore';

export interface NFLWeekRange {
  startDate: Date;
  endDate: Date;
  weekNumber: number;
}

export function getNFLWeekRange(): NFLWeekRange {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the Tuesday that starts the week
  const tuesday = new Date(now);
  const daysUntilTuesday = (currentDay < 2 ? -5 : 2) - currentDay;
  tuesday.setDate(now.getDate() + daysUntilTuesday);
  tuesday.setHours(0, 0, 0, 0);
  
  // Calculate the following Monday that ends the week
  const nextMonday = new Date(tuesday);
  nextMonday.setDate(tuesday.getDate() + 6);
  nextMonday.setHours(23, 59, 59, 999);

  // Calculate NFL week number (assuming season starts in September)
  const seasonStartYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
  const seasonStart = new Date(seasonStartYear, 8, 1); // September 1st
  const weekNumber = Math.ceil((tuesday.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  return {
    startDate: tuesday,
    endDate: nextMonday,
    weekNumber: weekNumber
  };
}

export function getFirestoreTimestampRange(): { startTimestamp: Timestamp; endTimestamp: Timestamp } {
  const { startDate, endDate } = getNFLWeekRange();
  return {
    startTimestamp: Timestamp.fromDate(startDate),
    endTimestamp: Timestamp.fromDate(endDate)
  };
}

export function formatDateRange(start: Date, end: Date): string {
  return `${start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })} - ${end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })}`;
}
