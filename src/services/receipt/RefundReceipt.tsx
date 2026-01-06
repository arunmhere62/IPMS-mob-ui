import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReceiptData } from './receiptTypes';

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatInr = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export const RefundReceipt: React.FC<{ data: ReceiptData }> = ({ data }) => {
  const pgAddressLine = (() => {
    const d = data.pgDetails;
    const parts = [d?.address, d?.city?.name, d?.state?.name].filter(Boolean);
    const base = parts.join(', ');
    const pin = d?.pincode ? ` - ${d.pincode}` : '';
    const full = `${base}${pin}`.trim();
    return full || null;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>PG Management</Text>
        <Text style={styles.title}>REFUND RECEIPT</Text>
        <Text style={styles.subtitle}>Refund Processed</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Receipt #</Text>
          <Text style={styles.metaValue}>{data.receiptNumber}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{formatDate(data.paymentDate)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tenant</Text>
        <View style={styles.kvRow}>
          <Text style={styles.kLabel}>Name</Text>
          <Text style={styles.kValue}>{data.tenantName}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kLabel}>Phone</Text>
          <Text style={styles.kValue}>{data.tenantPhone}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kLabel}>PG</Text>
          <Text style={styles.kValue}>{data.pgName}</Text>
        </View>
        {pgAddressLine ? (
          <View style={styles.kvRow}>
            <Text style={styles.kLabel}>Address</Text>
            <Text style={styles.kValue}>{pgAddressLine}</Text>
          </View>
        ) : null}
        <View style={styles.kvRow}>
          <Text style={styles.kLabel}>Room/Bed</Text>
          <Text style={styles.kValue}>Room {data.roomNumber} / Bed {data.bedNumber}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.kvRow}>
          <Text style={styles.kLabel}>Method</Text>
          <Text style={styles.kValue}>{data.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.amountBox}>
        <View style={styles.amountRowTotal}>
          <Text style={styles.totalLabel}>Refund Amount</Text>
          <Text style={styles.totalValue}>{formatInr(data.amountPaid)}</Text>
        </View>
      </View>

      {data.remarks ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remarks</Text>
          <Text style={styles.remarks}>{data.remarks}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>This is a system generated receipt.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    backgroundColor: '#DC2626',
    padding: 14,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  subtitle: {
    marginTop: 2,
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  metaValue: {
    marginTop: 2,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  kLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  kValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  amountBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  amountRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '900',
  },
  totalValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '900',
  },
  remarks: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
});
