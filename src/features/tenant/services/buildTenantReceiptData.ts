import type { ReceiptData, ReceiptType } from '@/services/receipt/receiptTypes';
import type { TenantProfileData } from '@/features/tenant/api/tenantPortalApi';

/**
 * Build a ReceiptData object from the tenant profile + a payment record.
 * Works for RENT, ADVANCE, and REFUND payments.
 */
export const buildTenantReceiptData = (
  raw: TenantProfileData,
  payment: any,
  kind: ReceiptType,
): ReceiptData => {
  const paymentDate = new Date(payment.payment_date);
  const pgName = payment?.pg_locations?.location_name || raw?.pg_locations?.location_name || 'PG';
  const roomNumber = payment?.rooms?.room_no || raw?.rooms?.room_no || '';
  const bedNumber = payment?.beds?.bed_no || raw?.beds?.bed_no || '';

  const pgDetails = raw?.pg_locations
    ? {
        pgId: raw.pg_locations.s_no,
        pgName: raw.pg_locations.location_name,
        address: raw.pg_locations.address,
        city: raw.pg_locations.city ?? undefined,
        state: raw.pg_locations.state ?? undefined,
      }
    : undefined;

  // Rent period from cycle
  const cycleStart = payment?.tenant_rent_cycles?.cycle_start || payment.payment_date;
  const cycleEnd = payment?.tenant_rent_cycles?.cycle_end || payment.payment_date;

  const prefix = kind === 'ADVANCE' ? 'ADV' : kind === 'REFUND' ? 'RFD' : 'RCP';
  const receiptNumber = `${prefix}-${payment.s_no}-${paymentDate.getFullYear()}`;

  return {
    receiptNumber,
    paymentDate,
    tenantName: raw?.name || 'Tenant',
    tenantPhone: raw?.phone_no || '',
    tenantEmail: raw?.email || undefined,
    tenantWhatsapp: raw?.whatsapp_number || undefined,
    tenantAddress: raw?.tenant_address || undefined,
    pgName,
    pgDetails,
    roomNumber,
    bedNumber,
    rentPeriod: {
      startDate: new Date(cycleStart),
      endDate: new Date(cycleEnd),
    },
    actualRent: Number(payment.actual_rent_amount || payment.amount_paid || 0),
    amountPaid: Number(payment.amount_paid || 0),
    paymentMethod: payment.payment_method || 'CASH',
    remarks: payment.remarks || undefined,
    receiptType: kind,
  };
};
