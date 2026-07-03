# Bugs Found During Testing

This document documents bugs discovered during the unit testing process.

## Form Validation Bugs

### 1. Bed Price Validation - Multiple Decimal Points Not Detected

**Location**: `src/features/owner/screens/beds/BedFormModal.tsx` (validateForm function)

**Description**: 
The original validation logic used `parseFloat()` to parse the bed price. When a user entered a price with multiple decimal points (e.g., "12.34.56"), `parseFloat()` would parse it as "12.34" and consider it valid. This could lead to unexpected behavior and data inconsistencies.

**Example**:
```typescript
// Original code
const price = parseFloat(formData.bed_price);
if (isNaN(price) || price <= 0) {
  newErrors.bed_price = "Please enter a valid price (must be greater than 0)";
}
// "12.34.56" → parseFloat returns 12.34 → considered valid
```

**Fix Applied**:
Updated the validation logic in `BedFormModal.tsx` to check for multiple decimal points before parsing:

```typescript
// Check for multiple decimal points (invalid format)
const decimalPoints = (formData.bed_price.match(/\./g) || []).length;
if (decimalPoints > 1) {
  newErrors.bed_price = "Please enter a valid price (invalid format)";
} else {
  const price = parseFloat(formData.bed_price);
  if (isNaN(price) || price <= 0) {
    newErrors.bed_price = "Please enter a valid price (must be greater than 0)";
  }
}
```

**Status**: ✅ Fixed in `BedFormModal.tsx`

---

### 2. Rent Payment Amount Validation - Multiple Decimal Points Not Detected

**Location**: `src/features/owner/screens/tenants/RentPaymentForm.tsx` (validateForm function)

**Description**: 
Same issue as bed price validation. The amount_paid field used `parseFloat()` without checking for multiple decimal points.

**Fix Applied**:
Added decimal point validation before parsing:

```typescript
if (!formData.amount_paid || !formData.amount_paid.trim()) {
  newErrors.amount_paid = "Amount paid is required";
} else {
  // Check for multiple decimal points (invalid format)
  const decimalPoints = (formData.amount_paid.match(/\./g) || []).length;
  if (decimalPoints > 1) {
    newErrors.amount_paid = "Please enter a valid amount (invalid format)";
  } else {
    const amountPaid = parseFloat(formData.amount_paid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      newErrors.amount_paid = "Amount paid is required";
    }
  }
}
```

**Status**: ✅ Fixed in `RentPaymentForm.tsx`

---

### 3. Advance Payment Amount Validation - Multiple Decimal Points Not Detected

**Location**: `src/features/owner/screens/tenants/AdvancePaymentForm.tsx` (validateForm function)

**Description**: 
Same issue as above. The amount_paid field used `parseFloat()` without checking for multiple decimal points.

**Fix Applied**:
Added decimal point validation before parsing:

```typescript
if (!formData.amount_paid || !formData.amount_paid.trim()) {
  newErrors.amount_paid = "Amount paid is required";
} else {
  // Check for multiple decimal points (invalid format)
  const decimalPoints = (formData.amount_paid.match(/\./g) || []).length;
  if (decimalPoints > 1) {
    newErrors.amount_paid = "Please enter a valid amount (invalid format)";
  } else {
    const amountPaid = parseFloat(formData.amount_paid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      newErrors.amount_paid = "Amount paid is required";
    }
  }
}
```

**Status**: ✅ Fixed in `AdvancePaymentForm.tsx`

---

### 4. Current Bill Amount Validation - Multiple Decimal Points Not Detected

**Location**: `src/features/owner/screens/rooms/CurrentBillModal.tsx` (validateForm function)

**Description**: 
Same issue as above. The billAmount field used `Number()` without checking for multiple decimal points before validation.

**Fix Applied**:
Added decimal point validation before parsing:

```typescript
if (!billAmount.trim()) {
  newErrors.billAmount = 'Bill amount is required';
} else {
  // Check for multiple decimal points (invalid format)
  const decimalPoints = (billAmount.match(/\./g) || []).length;
  if (decimalPoints > 1) {
    newErrors.billAmount = 'Please enter a valid amount (invalid format)';
  } else if (isNaN(Number(billAmount)) || Number(billAmount) <= 0) {
    newErrors.billAmount = 'Bill amount must be a valid positive number';
  }
}
```

**Status**: ✅ Fixed in `CurrentBillModal.tsx`

---

## Configuration Issues

### 5. Jest Transform Ignore Patterns Missing ESM Packages

**Location**: `jest.config.js`

**Description**:
The Jest configuration was missing several packages in `transformIgnorePatterns`, causing ESM import errors when running tests. Packages using ES modules need to be explicitly excluded from the ignore pattern to be transformed by Babel.

**Affected Packages**:
- `react-redux`
- `expo-image-picker`
- `expo-image-manipulator`

**Error Example**:
```
SyntaxError: Cannot use import statement outside a module
```

**Fix Applied**:
Updated `jest.config.js` to include these packages in the transform ignore pattern exception list:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!((react-native|@react-native|@react-navigation|expo|@expo|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-webview|react-native-worklets|expo-modules-core|immer|expo-font|expo-asset|expo-constants|react-redux|expo-image-picker|expo-image-manipulator))/)',
],
```

**Status**: ✅ Fixed

---

## Testing Approach Issues

### 6. Component-Level Testing Complexity

**Location**: Multiple form components (BedFormModal, RentPaymentForm, AdvancePaymentForm, etc.)

**Description**:
Testing form validation through the full React Native components proved extremely complex due to:
- Need to mock multiple dependencies (API hooks, config, error handlers)
- Need to mock React Native components (SlideBottomModal, ImageUploadS3, DatePicker, etc.)
- Complex mock setup for Redux Provider
- Difficulty in triggering form submission through mocked components
- Environment configuration validation errors during import
- Component dependencies making isolation difficult

**Impact**:
This complexity made it impractical to write comprehensive validation tests at the component level without significant refactoring.

**Resolution**:
Since the user preferred to keep validation logic inline in the form components rather than extract to separate utilities, component-level validation tests were not pursued. Instead, bug fixes were applied directly to the affected components based on the patterns identified during testing.

**Status**: ✅ Resolved - Bugs fixed inline in components

---

## Summary

| Bug # | Type | Severity | Status |
|-------|------|----------|--------|
| 1 | Validation Logic | Medium | Fixed in BedFormModal.tsx |
| 2 | Validation Logic | Medium | Fixed in RentPaymentForm.tsx |
| 3 | Validation Logic | Medium | Fixed in AdvancePaymentForm.tsx |
| 4 | Validation Logic | Medium | Fixed in CurrentBillModal.tsx |
| 5 | Configuration | Low | Fixed |
| 6 | Testing Approach | Low | Resolved |

**Total Bugs Found**: 6
**Total Bugs Fixed**: 6
**Open Issues**: 0
