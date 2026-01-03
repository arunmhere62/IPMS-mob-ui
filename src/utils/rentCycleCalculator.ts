/**
 * Rent Cycle Calculator Utility
 * Handles calculation of rent payment dates based on cycle type (CALENDAR or MIDMONTH)
 */

export interface RentCycleData {
  type: 'CALENDAR' | 'MIDMONTH';
  startDay: number;
  endDay: number;
}

export interface CalculatedDates {
  startDate: string;
  endDate: string;
}

/**
 * Calculate rent cycle dates based on cycle type
 * 
 * CALENDAR: Monthly cycle from startDay to endDay (e.g., 1st to 30th)
 * MIDMONTH: Custom cycle based on startDay and endDay (e.g., 9th to 8th of next month)
 * 
 * @param cycleType - Type of rent cycle ('CALENDAR' or 'MIDMONTH')
 * @param startDay - Start day of the cycle
 * @param endDay - End day of the cycle
 * @returns Object with startDate and endDate in 'YYYY-MM-DD' format
 */
export const calculateRentCycleDates = (
  cycleType: 'CALENDAR' | 'MIDMONTH',
  startDay: number,
  endDay: number
): CalculatedDates => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();

  let startDate: Date;
  let endDate: Date;

  if (cycleType === 'CALENDAR') {
    // CALENDAR: Start from the specified day of current/next month
    if (currentDay >= startDay) {
      // Start from next month
      startDate = new Date(year, month + 1, startDay);
    } else {
      // Start from current month
      startDate = new Date(year, month, startDay);
    }
    // End date is the day before the next cycle starts
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);
  } else {
    // MIDMONTH: Split month into two parts
    if (currentDay <= 15) {
      startDate = new Date(year, month, startDay);
      endDate = new Date(year, month, endDay);
    } else {
      startDate = new Date(year, month, startDay);
      if (startDate < today) {
        startDate = new Date(year, month + 1, startDay);
      }
      endDate = new Date(year, month, endDay);
      if (endDate < today) {
        endDate = new Date(year, month + 1, endDay);
      }
    }
  }

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

/**
 * Calculate next rent cycle dates based on previous payment's end date
 * Used when tenant has existing payments
 * 
 * @param lastPaymentEndDate - End date of the last payment
 * @param cycleType - Type of rent cycle ('CALENDAR' or 'MIDMONTH')
 * @param startDay - Start day of the cycle
 * @param endDay - End day of the cycle
 * @returns Object with startDate and endDate in 'YYYY-MM-DD' format
 */
export const calculateNextRentCycleDates = (
  lastPaymentEndDate: string,
  cycleType: 'CALENDAR' | 'MIDMONTH',
  _startDay: number,
  _endDay: number
): CalculatedDates => {
  const lastEndDate = new Date(lastPaymentEndDate);

  // Calculate next cycle dates starting from the day after last payment ended
  const nextStartDate = new Date(lastEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  // Calculate end date based on rent cycle
  let nextEndDate: Date;
  if (cycleType === 'CALENDAR') {
    // For CALENDAR: End date is the day before next cycle starts
    nextEndDate = new Date(nextStartDate);
    nextEndDate.setMonth(nextEndDate.getMonth() + 1);
    nextEndDate.setDate(nextEndDate.getDate() - 1);
  } else {
    // For MIDMONTH: Same day next month - 1
    // Get the day of the start date
    const nextStartDay = nextStartDate.getDate();
    // Create date with same day in next month
    nextEndDate = new Date(nextStartDate.getFullYear(), nextStartDate.getMonth() + 1, nextStartDay);
    // Subtract 1 day to get the end date
    nextEndDate.setDate(nextEndDate.getDate() - 1);
  }

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: formatDate(nextStartDate),
    endDate: formatDate(nextEndDate),
  };
};
