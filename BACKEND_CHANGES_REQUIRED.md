# Backend Changes Required

## 1. Advance/Refund Payment Limits

### Current State
- Backend restricts users to add only **1 advance payment** and **1 refund payment** per tenant

### Required Changes
- Update backend validation to allow **up to 3 advance payments** per tenant
- Update backend validation to allow **up to 3 refund payments** per tenant

### Affected Endpoints
- `POST /api/advance-payments` - Add advance payment
- `POST /api/refund-payments` - Add refund payment

### Validation Logic
```typescript
// Current (example)
if (existingAdvancePayments.length >= 1) {
  throw new Error("Maximum 1 advance payment allowed");
}

// Required
if (existingAdvancePayments.length >= 3) {
  throw new Error("Maximum 3 advance payments allowed");
}
```

---

## 2. Tenant Details API Enhancement

### Current State
- Tenant details API returns `advance_payments` and `refund_payments` arrays
- Frontend calculates totals manually

### Required Changes
Add summary fields to tenant details API response to improve performance and data consistency:

### New Fields to Add in Tenant Details Response

```typescript
{
  // ... existing fields
  
  // Advance Payment Summary
  "advance_payment_summary": {
    "total_advance_paid": number,      // Sum of all advance payments
    "total_advance_count": number,      // Count of advance payments (max 3)
    "advance_payments": [...]            // Existing array (keep for details)
  },
  
  // Refund Payment Summary
  "refund_payment_summary": {
    "total_refund_given": number,       // Sum of all refunds
    "total_refund_count": number,       // Count of refunds (max 3)
    "refund_payments": [...]             // Existing array (keep for details)
  },
  
  // Net Advance Calculation
  "net_advance_remaining": number       // total_advance_paid - total_refund_given
}
```

### Example Response
```json
{
  "s_no": 1,
  "name": "John Doe",
  "advance_payment_summary": {
    "total_advance_paid": 15000,
    "total_advance_count": 2,
    "advance_payments": [
      { "s_no": 1, "amount_paid": 10000, ... },
      { "s_no": 2, "amount_paid": 5000, ... }
    ]
  },
  "refund_payment_summary": {
    "total_refund_given": 3000,
    "total_refund_count": 1,
    "refund_payments": [
      { "s_no": 1, "amount_paid": 3000, ... }
    ]
  },
  "net_advance_remaining": 12000
}
```

### Benefits
- **Performance**: Backend calculates totals once instead of frontend recalculating
- **Consistency**: Single source of truth for calculations
- **Simpler Frontend**: Remove complex reduce operations from frontend code

---

## 3. Frontend Updates After Backend Changes

### After API is updated, update frontend to use new fields:

**TenantDetailsScreen.tsx**
```typescript
// Replace manual calculations with API fields
const totalAdvancePaid = tenant.advance_payment_summary?.total_advance_paid || 0;
const totalRefundGiven = tenant.refund_payment_summary?.total_refund_given || 0;
const netAdvanceRemaining = tenant.net_advance_remaining || 0;
```

**AddRefundPaymentModal.tsx**
```typescript
// Use API field instead of manual calculation
totalAdvancePaid={tenant.advance_payment_summary?.total_advance_paid || 0}
```

---

## Priority
- **High**: Update advance/refund limits (1 → 3)
- **Medium**: Add summary fields to tenant details API (performance improvement)

---

## Testing Checklist
- [ ] Verify 3 advance payments can be added
- [ ] Verify 3 refund payments can be added
- [ ] Verify 4th advance payment is rejected with appropriate error
- [ ] Verify 4th refund payment is rejected with appropriate error
- [ ] Verify summary fields are correctly calculated
- [ ] Verify net advance remaining is accurate
- [ ] Test with 0 advance/refund payments
- [ ] Test with mixed advance/refund scenarios
