import { StyleSheet } from 'react-native';

// Professional monochrome receipt palette optimized for print/PDF clarity
export const ReceiptColors = {
  background: '#FFFFFF',
  primary: '#1F2937', // Charcoal header
  secondary: '#F8FAFC', // Light gray section background
  border: '#E2E8F0',
  textPrimary: '#111827',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#0F4C81', // Professional navy blue
  success: '#15803D',
  danger: '#B91C1C',
};

export const receiptStyles = StyleSheet.create({
  container: {
    width: 600,
    backgroundColor: ReceiptColors.background,
    borderWidth: 1,
    borderColor: ReceiptColors.border,
    overflow: 'hidden',
    // No border radius for a formal document look
  },
  header: {
    backgroundColor: ReceiptColors.primary,
    padding: 24,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandAddress: {
    marginTop: 4,
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: ReceiptColors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: ReceiptColors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: ReceiptColors.border,
    gap: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: ReceiptColors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 4,
    fontSize: 14,
    color: ReceiptColors.textPrimary,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ReceiptColors.accent,
    marginBottom: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItemHalf: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 12,
  },
  infoItemFull: {
    width: '100%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: ReceiptColors.textMuted,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: ReceiptColors.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  infoValueMultiline: {
    fontSize: 13,
    color: ReceiptColors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: ReceiptColors.border,
    marginVertical: 16,
  },
  amountSection: {
    backgroundColor: ReceiptColors.secondary,
    borderWidth: 1,
    borderColor: ReceiptColors.border,
    borderRadius: 6,
    padding: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 13,
    color: ReceiptColors.textSecondary,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 14,
    color: ReceiptColors.textPrimary,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ReceiptColors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: ReceiptColors.textPrimary,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 24,
    color: ReceiptColors.accent,
    fontWeight: '900',
  },
  hintText: {
    fontSize: 12,
    color: ReceiptColors.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
  },
  remarksBox: {
    backgroundColor: ReceiptColors.secondary,
    borderRadius: 6,
    padding: 14,
  },
  remarksLabel: {
    fontSize: 11,
    color: ReceiptColors.textMuted,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  remarks: {
    fontSize: 13,
    color: ReceiptColors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: ReceiptColors.border,
    alignItems: 'center',
    backgroundColor: ReceiptColors.secondary,
  },
  footerText: {
    fontSize: 11,
    color: ReceiptColors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const formatInr = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export const formatTenantAddress = (data: {
  tenantAddress?: string;
  tenantCity?: string;
  tenantState?: string;
  tenantPincode?: string;
}): string => {
  const parts = [
    data.tenantAddress,
    data.tenantCity,
    data.tenantState,
    data.tenantPincode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

export const formatPgAddress = (pgDetails?: {
  address?: string;
  city?: { name?: string };
  state?: { name?: string };
  pincode?: string;
}): string => {
  if (!pgDetails) return 'N/A';
  const parts = [
    pgDetails.address,
    pgDetails.city?.name,
    pgDetails.state?.name,
    pgDetails.pincode ? `PIN: ${pgDetails.pincode}` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};
