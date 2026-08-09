# Calendar vs Midmonth Rent Cycle Logic - Complete Guide

## Overview
The RentPaymentForm implements two different rent cycle types for property management:
1. **CALENDAR** - Rent period aligned with calendar months
2. **MIDMONTH** - Rent period based on a specific day of the month

---

## 1. CALENDAR CYCLE

### Definition
A rent period that spans from the **1st day to the last day of a calendar month**.

### Rules
- **Start Date**: Always the 1st of the month
- **End Date**: Always the last day of the month (28, 29, 30, or 31 depending on the month)
- **Duration**: Varies (28-31 days)
- **Validation**: Start must be 1st, End must be last day of same month

### Example
```
Joining Date: 15 Dec 2025
First Rent Period: 01 Dec 2025 - 31 Dec 2025
Second Rent Period: 01 Jan 2026 - 31 Jan 2026
Third Rent Period: 01 Feb 2026 - 28 Feb 2026
```

### Implementation in Code
```typescript
// Helper function to get calendar month dates (1st to last day)
const getCalendarMonthDates = (dateString: string): { start: string; end: string } => {
  const date = parseDate(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();

  const startDate = new Date(year, month, 1);           // 1st of month
  const endDate = new Date(year, month + 1, 0);         // Last day of month

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};
```

### Validation Logic
```typescript
if (rentCycleData.type === 'CALENDAR') {
  const isFirstOfMonth = startDay === 1;
  const lastDayOfMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const isLastDayOfMonth = endDay === lastDayOfMonth && endMonth === startMonth && endYear === startYear;

  if (!isFirstOfMonth || !isLastDayOfMonth) {
    newErrors.end_date = "CALENDAR cycle: Period must be from 1st to last day of the month";
  }
}
```

---

## 2. MIDMONTH CYCLE

### Definition
A rent period that spans from a **specific day of one month to the same day of the next month minus 1 day**.

### Rules
- **Start Date**: Any day of the month (e.g., 15th)
- **End Date**: Same day of next month - 1 day (e.g., 14th of next month)
- **Duration**: Consistent (~30 days, varies slightly by month)
- **Validation**: End date must be same-day-next-month minus 1

### Example
```
Joining Date: 15 Dec 2025
First Rent Period: 15 Dec 2025 - 14 Jan 2026 (31 days)
Second Rent Period: 15 Jan 2026 - 14 Feb 2026 (31 days)
Third Rent Period: 15 Feb 2026 - 14 Mar 2026 (28 days)

Joining Date: 01 Dec 2025
First Rent Period: 01 Dec 2025 - 30 Dec 2025 (30 days)
Second Rent Period: 01 Jan 2026 - 31 Jan 2026 (31 days)
```

### Implementation in Code
```typescript
// Helper function to get midmonth dates (same day to same day next month - 1)
const getMidmonthDates = (dateString: string): { start: string; end: string } => {
  let year: number, month: number, day: number;
  
  if (dateString.includes('-')) {
    const [y, m, d] = dateString.split('-').map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    const date = parseDate(dateString);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }

  // Start date is the input date
  const startDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Calculate end date: same day next month - 1
  let endMonth = month + 1;
  let endYear = year;
  if (endMonth > 12) {
    endMonth = 1;
    endYear = year + 1;
  }
  
  // Create a temporary date to handle day overflow
  const tempDate = new Date(endYear, endMonth - 1, day);
  tempDate.setDate(tempDate.getDate() - 1);
  
  const endDateStr = formatDate(tempDate);

  return {
    start: startDateStr,
    end: endDateStr,
  };
};
```

### Validation Logic
```typescript
if (rentCycleData.type === 'MIDMONTH') {
  const startDay = startDate.getDate();
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();

  const endDay = endDate.getDate();
  const endMonth = endDate.getMonth();
  const endYear = endDate.getFullYear();

  // Calculate expected end date
  let expectedEndDate = new Date(startYear, startMonth + 1, startDay);
  expectedEndDate.setDate(expectedEndDate.getDate() - 1);

  // Check if end date matches expected (with 1 day tolerance)
  const dayDiff = Math.abs(endDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24);

  if (dayDiff > 1) {
    const expectedDay = startDay === 1 ? 30 : startDay - 1;
    newErrors.end_date = `MIDMONTH cycle: Period should be from ${startDay}th to ${expectedDay}th of next month`;
  }
}
```

---

## 3. KEY DIFFERENCES

| Aspect | CALENDAR | MIDMONTH |
|--------|----------|----------|
| **Start Date** | Always 1st of month | Any day of month |
| **End Date** | Last day of month | Same day next month - 1 |
| **Duration** | 28-31 days (varies) | ~30 days (consistent) |
| **Alignment** | Calendar month boundaries | Tenant joining date |
| **Use Case** | Utility billing, standard rentals | Flexible joining dates |
| **Example** | 01 Dec - 31 Dec | 15 Dec - 14 Jan |
| **Validation** | Start=1st AND End=Last | End = Start + 1 month - 1 day |
| **Complexity** | Simple | Handles month-end edge cases |

---

## 4. IMPLEMENTATION FLOW

### When Adding a New Payment

```
1. Check if tenant has previous payments
   ├─ YES: Use last payment's end_date to calculate next cycle
   └─ NO: Use joining date to calculate first cycle

2. Based on rent_cycle_type (CALENDAR or MIDMONTH):
   ├─ CALENDAR: getCalendarMonthDates(joiningDate)
   └─ MIDMONTH: getMidmonthDates(joiningDate)

3. Auto-fill start_date and end_date in form

4. User can manually adjust dates if needed

5. On submit, validate dates match the cycle pattern

6. Save payment with validated dates
```

### Auto-fill Logic
```typescript
const handleAutoFillDates = () => {
  if (hasPreviousPayments && lastPaymentEndDate) {
    // Next cycle starts after last payment ends
    const { startDate, endDate } = calculateNextRentCycleDates(
      lastPaymentEndDate,
      rentCycleData.type,
      1,  // number of cycles
      30  // days in cycle (approximate)
    );
  } else {
    // First payment uses joining date
    if (rentCycleData.type === 'CALENDAR') {
      const dates = getCalendarMonthDates(joiningDate);
    } else {
      const dates = getMidmonthDates(joiningDate);
    }
  }
};
```

---

## 5. EDGE CASES HANDLED

### Calendar Cycle
- ✅ February with 28/29 days
- ✅ Months with 30/31 days
- ✅ Year transitions (Dec to Jan)

### Midmonth Cycle
- ✅ Day 31 in months with 30 days (auto-adjusts to 30)
- ✅ Day 29/30/31 in February (auto-adjusts)
- ✅ Year transitions
- ✅ 1-day tolerance in validation for month variations

### Example Edge Case
```
Joining Date: 31 Jan 2026 (MIDMONTH)
First Period: 31 Jan 2026 - 28 Feb 2026 (Feb has only 28 days)
Second Period: 01 Mar 2026 - 31 Mar 2026 (auto-adjusted)
```

---

## 6. VALIDATION RULES

### Both Cycles
- ✅ Start date must be before end date
- ✅ Payment date must be provided
- ✅ Amount paid must be > 0
- ✅ Amount paid cannot exceed actual rent amount

### Calendar-Specific
- ✅ Start date must be 1st of month
- ✅ End date must be last day of same month

### Midmonth-Specific
- ✅ End date must be approximately same-day-next-month minus 1
- ✅ Allows 1-day tolerance for month variations

---

## 7. PRACTICAL EXAMPLES

### Scenario 1: CALENDAR Cycle
```
PG Setup: CALENDAR rent cycle
Tenant Joining: 15 Dec 2025
Bed Rent: ₹5,000

Payment 1:
  Start: 01 Dec 2025
  End: 31 Dec 2025
  Amount: ₹5,000
  Status: PAID

Payment 2:
  Start: 01 Jan 2026
  End: 31 Jan 2026
  Amount: ₹5,000
  Status: PAID

Payment 3:
  Start: 01 Feb 2026
  End: 28 Feb 2026
  Amount: ₹5,000
  Status: PENDING
```

### Scenario 2: MIDMONTH Cycle
```
PG Setup: MIDMONTH rent cycle
Tenant Joining: 15 Dec 2025
Bed Rent: ₹5,000

Payment 1:
  Start: 15 Dec 2025
  End: 14 Jan 2026
  Amount: ₹5,000
  Status: PAID

Payment 2:
  Start: 15 Jan 2026
  End: 14 Feb 2026
  Amount: ₹5,000
  Status: PAID

Payment 3:
  Start: 15 Feb 2026
  End: 14 Mar 2026
  Amount: ₹5,000
  Status: PENDING
```

---

## 8. CODE LOCATIONS IN RentPaymentForm.tsx

### Core Date Calculation Functions
| Function | Purpose |
|----------|---------|
| `parseDate()` | Parse date strings in multiple formats |
| `formatDate()` | Format Date to YYYY-MM-DD |
| `getCalendarMonthDates()` | Calculate calendar month dates (1st to last day) |
| `getMidmonthDates()` | Calculate midmonth dates (same day to same day next month - 1) |

### Gap Detection & Display (Separate Logic)
| Function | Purpose |
|----------|---------|
| `formatCalendarGapDisplay()` | Format gap display for CALENDAR cycle (month-based) |
| `formatMidmonthGapDisplay()` | Format gap display for MIDMONTH cycle (day-based) |
| `formatGapMonthDisplay()` | Unified dispatcher for gap formatting |

### Continue to Next Payment (Separate Logic)
| Function | Purpose |
|----------|---------|
| `handleContinueToNextPaymentCalendar()` | Handle skip gaps for CALENDAR cycle |
| `handleContinueToNextPaymentMidmonth()` | Handle skip gaps for MIDMONTH cycle |
| `handleContinueToNextPayment()` | Unified dispatcher for skip gaps handling |

### Payment Reference Section (Separate Logic)
| Function | Purpose |
|----------|---------|
| `renderCalendarRentCycleInfo()` | Render rent cycle info for CALENDAR cycle |
| `renderMidmonthRentCycleInfo()` | Render rent cycle info for MIDMONTH cycle |
| `renderRentCycleInfo()` | Unified dispatcher for rent cycle info rendering |

### Form Validation & Auto-fill
| Function | Purpose |
|----------|---------|
| `validateForm()` | Validate form including cycle-specific rules |
| `handleAutoFillDates()` | Auto-fill dates based on cycle type |
| `useEffect()` | Initialize form with cycle logic |

---

## 11. BACKEND IMPLEMENTATION (rent-payment.service.ts)

### Gap Detection (Enhanced)
| Function | Purpose |
|----------|---------|
| `detectPaymentGaps()` | Detect gaps from check-in date to first payment AND between consecutive payments |

**Enhanced Features:**
- ✅ Checks gap from tenant check-in date to first payment start
- ✅ Checks gaps between consecutive payments
- ✅ Check-in gaps marked with `isCheckInGap: true` and priority -1 (highest)
- ✅ Returns `afterPaymentId: null` for check-in gaps
- ✅ Properly handles cases where tenant checks in but first payment is much later

### Next Payment Dates Calculation (Separate Logic)
| Function | Purpose |
|----------|---------|
| `calculateNextPaymentDatesCalendar()` | Calculate next payment dates for CALENDAR cycle (1st to last day of next month) |
| `calculateNextPaymentDatesMidmonth()` | Calculate next payment dates for MIDMONTH cycle (same day next month - 1) |
| `calculateNextPaymentDates()` | Unified dispatcher for next payment dates calculation |
| `getNextPaymentDates()` | Main API method that handles gap detection and next dates calculation |

### Implementation Details

**CALENDAR Cycle Logic:**
```typescript
private calculateNextPaymentDatesCalendar(lastPaymentEndDate: Date) {
  // Next payment starts on 1st of next month
  const nextMonthStart = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);
  
  // End date is last day of that month
  const endOfMonth = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0);
  
  return { startDate, endDate };
}
```

**MIDMONTH Cycle Logic:**
```typescript
private calculateNextPaymentDatesMidmonth(lastPaymentEndDate: Date) {
  // Next payment starts the day after last payment ends
  const nextStart = new Date(lastPaymentEndDate);
  nextStart.setDate(nextStart.getDate() + 1);
  
  // End date is same day next month - 1
  const endDate = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, nextStart.getDate());
  endDate.setDate(endDate.getDate() - 1);
  
  return { startDate, endDate };
}
```

### Gap Detection Logic

**Check-In Gap Detection:**
```typescript
// If tenant checks in on 15th but first payment starts on 1st of next month
Check-in Date: 15 Dec 2025
First Payment: 01 Jan 2026

Gap Detected:
- gapStart: 16 Dec 2025
- gapEnd: 31 Dec 2025
- daysMissing: 16 days
- isCheckInGap: true
- priority: -1 (highest priority)
```

**Consecutive Payment Gap Detection:**
```typescript
// If there's a gap between two payments
Payment 1 End: 31 Dec 2025
Payment 2 Start: 10 Jan 2026

Gap Detected:
- gapStart: 01 Jan 2026
- gapEnd: 09 Jan 2026
- daysMissing: 9 days
- isCheckInGap: false
- priority: 0 (lower priority than check-in gaps)
```

### API Response Enhancement
Both CALENDAR and MIDMONTH now return:
- `suggestedStartDate`: Next payment start date
- `suggestedEndDate`: Next payment end date (newly added)
- `isGapFill`: Whether this is a gap fill or regular next payment
- `message`: Includes cycle type information

### Gap Response Structure
```typescript
{
  gapId: "gap_checkin_0" | "gap_0",
  gapStart: "2025-12-16",
  gapEnd: "2025-12-31",
  daysMissing: 16,
  afterPaymentId: null | number,        // null for check-in gaps
  beforePaymentId: number,
  priority: -1 | 0 | 1...,              // -1 for check-in gaps (highest)
  isCheckInGap: boolean                 // true for check-in gaps
}
```

---

## 9. SEPARATION OF LOGIC PATTERN

The RentPaymentForm uses a **dispatcher pattern** to keep CALENDAR and MIDMONTH logic separate and clean:

### Pattern Structure
```
┌─────────────────────────────────────────────────────────┐
│ Unified Dispatcher Function                             │
│ (e.g., formatGapMonthDisplay, renderRentCycleInfo)     │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼──────┐    ┌────▼──────────┐
    │ CALENDAR  │    │ MIDMONTH      │
    │ Specific  │    │ Specific      │
    │ Function  │    │ Function      │
    └───────────┘    └───────────────┘
```

### Benefits
- ✅ **Maintainability**: Each cycle type has dedicated logic
- ✅ **Clarity**: Easy to understand what each function does
- ✅ **Extensibility**: Simple to add new features per cycle type
- ✅ **Testing**: Can test each cycle type independently
- ✅ **Debugging**: Issues are isolated to specific functions

### Example: Gap Display Formatting

**Dispatcher Function:**
```typescript
const formatGapMonthDisplay = (gapStart: string, gapEnd: string): string => {
  if (!rentCycleData) return `${gapStart} to ${gapEnd}`;
  
  if (rentCycleData.type === 'CALENDAR') {
    return formatCalendarGapDisplay(gapStart, gapEnd);
  } else {
    return formatMidmonthGapDisplay(gapStart, gapEnd);
  }
};
```

**CALENDAR Implementation:**
```typescript
const formatCalendarGapDisplay = (gapStart: string, gapEnd: string): string => {
  // Shows month and year (e.g., "Nov 2025" or "Nov 2025 - Dec 2025")
  // Suitable for full calendar months
};
```

**MIDMONTH Implementation:**
```typescript
const formatMidmonthGapDisplay = (gapStart: string, gapEnd: string): string => {
  // Shows day ranges (e.g., "15 Nov 2025 - 14 Dec 2025")
  // Clearly distinguishes midmonth periods with specific days
};
```

### Example: Continue to Next Payment (Skip Gaps)

**Dispatcher Function:**
```typescript
const handleContinueToNextPayment = async () => {
  if (!rentCycleData) {
    Alert.alert("Error", "Rent cycle data not available");
    return;
  }

  if (rentCycleData.type === 'CALENDAR') {
    await handleContinueToNextPaymentCalendar();
  } else {
    await handleContinueToNextPaymentMidmonth();
  }
};
```

**CALENDAR Implementation:**
```typescript
const handleContinueToNextPaymentCalendar = async () => {
  try {
    const response = await paymentService.getNextPaymentDates(tenantId, 'CALENDAR', true);
    
    if (response.success && response.data) {
      const nextDates = response.data as any;
      
      // Auto-fill form with next payment dates
      setFormData((prev) => ({
        ...prev,
        start_date: nextDates.suggestedStartDate,
        end_date: nextDates.suggestedEndDate || nextDates.suggestedStartDate,
        status: "PENDING",
      }));
      
      // Hide gap warning and mark as skipped
      setGapWarning((prev) => ({
        ...prev,
        skipGaps: true,
        visible: false,
      }));
    }
  } catch (error) {
    console.error("Error getting next payment dates (CALENDAR):", error);
    Alert.alert("Error", "Failed to calculate next payment dates");
  }
};
```

**MIDMONTH Implementation:**
```typescript
const handleContinueToNextPaymentMidmonth = async () => {
  try {
    const response = await paymentService.getNextPaymentDates(tenantId, 'MIDMONTH', true);
    
    if (response.success && response.data) {
      const nextDates = response.data as any;
      
      // Auto-fill form with next payment dates
      setFormData((prev) => ({
        ...prev,
        start_date: nextDates.suggestedStartDate,
        end_date: nextDates.suggestedEndDate || nextDates.suggestedStartDate,
        status: "PENDING",
      }));
      
      // Hide gap warning and mark as skipped
      setGapWarning((prev) => ({
        ...prev,
        skipGaps: true,
        visible: false,
      }));
    }
  } catch (error) {
    console.error("Error getting next payment dates (MIDMONTH):", error);
    Alert.alert("Error", "Failed to calculate next payment dates");
  }
};
```

### Example: Rent Cycle Info Rendering

**Dispatcher Function:**
```typescript
const renderRentCycleInfo = () => {
  if (!rentCycleData) return null;
  
  if (rentCycleData.type === 'CALENDAR') {
    return renderCalendarRentCycleInfo();
  } else {
    return renderMidmonthRentCycleInfo();
  }
};
```

**CALENDAR Implementation:**
```typescript
const renderCalendarRentCycleInfo = () => (
  <View>
    <Text>📅 Calendar (1st - Last day)</Text>
  </View>
);
```

**MIDMONTH Implementation:**
```typescript
const renderMidmonthRentCycleInfo = () => (
  <View>
    <Text>🔄 Mid-Month (Any day - Same day next month - 1)</Text>
  </View>
);
```

---

## 10. SUMMARY

**CALENDAR Cycle** is best for:
- Standard monthly billing
- Aligned with calendar months
- Simpler for tenants to understand

**MIDMONTH Cycle** is best for:
- Flexible tenant joining dates
- Consistent payment intervals (~30 days)
- Better for mid-month joiners

Both cycles are fully validated and handle edge cases automatically in the RentPaymentForm component.
