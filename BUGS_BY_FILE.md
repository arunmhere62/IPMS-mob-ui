# Bugs Found By File

## AmountInput.tsx

### Bugs Found
1. **Line 31-42: Decimal point handling is incomplete**
   - **Issue**: The handleChange function only prevents multiple decimal points when typing, but doesn't prevent pasting text with multiple decimals
   - **Impact**: User can still bypass validation by pasting
   - **Fix**: Add validation for pasted content or use a more robust input mask

2. **No negative number validation**
   - **Issue**: User can enter negative amounts (e.g., "-100")
   - **Impact**: Could cause calculation errors downstream
   - **Fix**: Add validation to prevent negative numbers in handleChange

3. **No maximum amount validation**
   - **Issue**: No limit on maximum amount that can be entered
   - **Impact**: Could cause database issues with very large numbers
   - **Fix**: Add maxAmount prop and validation

4. **Line 77: onChangeText can be bypassed**
   - **Issue**: If parent component calls onChangeText directly, validation is skipped
   - **Impact**: Validation can be circumvented
   - **Fix**: Consider using controlled input with internal state

---

## AdvancePaymentForm.tsx

### Bugs Found
1. **Line 44-52: formatBedNo/formatRoomNo return empty string for null/undefined**
   - **Issue**: When bedNo or roomNo is null/undefined, returns empty string which might not be desired
   - **Impact**: Could display incorrect information in subtitle
   - **Fix**: Return the original value or a placeholder like "N/A"

2. **Line 133: bedId validation doesn't handle negative values**
   - **Issue**: Condition `bedId > 0` doesn't explicitly reject negative values
   - **Impact**: Negative bedId could pass validation
   - **Fix**: Change to `bedId > 0 && bedId !== null && bedId !== undefined`

3. **Line 102: Date parsing timezone issue**
   - **Issue**: `toISOString().split("T")[0]` converts to UTC which could shift the date
   - **Impact**: Date might show as previous/next day depending on timezone
   - **Fix**: Use local date formatting instead of ISO conversion

4. **No maximum amount validation**
   - **Issue**: No limit on advance payment amount
   - **Impact**: Could allow unrealistic amounts
   - **Fix**: Add validation in validateForm

5. **Line 112-115: Complex type checking for bed price**
   - **Issue**: Nested type checking is fragile and could fail with unexpected API responses
   - **Impact**: Could fail to extract bed price correctly
   - **Fix**: Add proper TypeScript types and runtime validation with fallback

---

## RentPaymentForm.tsx

### Bugs Found
1. **Line 64-72: formatBedNo/formatRoomNo same issues as AdvancePaymentForm**
   - **Issue**: Returns empty string for null/undefined
   - **Impact**: Display issues
   - **Fix**: Same as AdvancePaymentForm

2. **Line 75-92: parseDate returns new Date() for invalid input**
   - **Issue**: When date parsing fails, returns current date instead of null/throwing
   - **Impact**: Could silently use wrong date
   - **Fix**: Return null or throw error for invalid dates

3. **No negative amount validation**
   - **Issue**: No validation for negative rent amounts
   - **Impact**: Calculation errors
   - **Fix**: Add validation

---

## AddRefundPaymentModal.tsx

### Bugs Found
1. **Line 65-73: formatBedNo/formatRoomNo same issues**
   - **Issue**: Returns empty string for null/undefined
   - **Impact**: Display issues
   - **Fix**: Same as above

2. **No validation that refund amount doesn't exceed total advance paid**
   - **Issue**: User can refund more than they paid in advance
   - **Impact**: Could lead to negative net advance
   - **Fix**: Add validation in handleSave to check `parseFloat(amountPaid) <= totalAdvancePaid`

3. **Line 169: Status hardcoded but interface still accepts it**
   - **Issue**: Status is always 'PAID' but the data structure still has status field
   - **Impact**: Inconsistent API contract
   - **Fix**: Remove status from data being sent or make it optional

---

## TenantDetailsScreen.tsx

### Bugs Found
1. **Line 1383, 1389, 1402: No null checks for summary fields**
   - **Issue**: If API doesn't return summary fields, could crash
   - **Impact**: Runtime error if backend changes
   - **Fix**: Already has fallback with `|| 0` but could be more defensive

2. **Line 2208: No validation that totalAdvancePaid is a number**
   - **Issue**: If API returns string, could cause display issues
   - **Impact**: Display formatting might fail
   - **Fix**: Add `Number()` conversion with validation

---

## Backend: advance-payment.service.ts

### Bugs Found
1. **Line 37-43: Uses findMany instead of count for validation**
   - **Issue**: Fetches all advance payments just to check count
   - **Impact**: Performance issue with many payments
   - **Fix**: Use `count()` instead of `findMany()`

2. **No validation for maximum amount**
   - **Issue**: No limit on advance payment amount
   - **Impact**: Could allow unrealistic amounts
   - **Fix**: Add max amount validation

---

## Backend: refund-payment.service.ts

### Bugs Found
1. **Line 24-29: Same performance issue as advance-payment**
   - **Issue**: Uses findMany instead of count
   - **Impact**: Performance issue
   - **Fix**: Use `count()` instead of `findMany()`

2. **No validation that refund doesn't exceed advance**
   - **Issue**: Backend doesn't check if refund amount exceeds total advance
   - **Impact**: Could allow negative net advance
   - **Fix**: Add validation to check tenant's total advance before allowing refund

---

## Backend: tenant.service.ts

### Bugs Found
1. **Line 1017-1025: Reduce operations could fail with invalid data**
   - **Issue**: If amount_paid is null/undefined/invalid string, parseFloat could return NaN
   - **Impact**: Summary calculations could be incorrect
   - **Fix**: Already has isNaN check but could be more defensive

2. **No validation that net_advance_remaining is not negative**
   - **Issue**: If refunds exceed advances, net could be negative
   - **Impact**: Might be valid but should be validated
   - **Fix**: Consider if negative net should be allowed or clamped to 0

---

## Priority Summary

### High Priority (Fix Immediately)
1. **AddRefundPaymentModal**: Add validation that refund doesn't exceed total advance
2. **Backend refund-payment.service.ts**: Add same validation
3. **AmountInput**: Add negative number prevention
4. **AdvancePaymentForm**: Fix date parsing timezone issue

### Medium Priority
1. **Backend services**: Use count() instead of findMany() for performance
2. **All format functions**: Handle null/undefined better
3. **AmountInput**: Add max amount validation

### Low Priority
1. **TypeScript type safety improvements**
2. **Add more defensive null checks**
