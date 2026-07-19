import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text } from 'react-native';
import { Card } from '../../../../../components/Card';
import { Theme } from '../../../../../theme';
import { PendingPayment, PendingPaymentMonth } from '@/features/owner/api/tenantsApi';

interface PendingPaymentAlertProps {
  pendingPayment: PendingPayment;
}

export const PendingPaymentAlert: React.FC<PendingPaymentAlertProps> = ({ pendingPayment }) => {
  const [expandedMonths, setExpandedMonths] = useState(false);

  if (!pendingPayment || pendingPayment.total_pending <= 0) {
    return null;
  }

  return (
    <Card
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor:
          pendingPayment.payment_status === 'OVERDUE'
            ? '#FEE2E2'
            : pendingPayment.payment_status === 'PARTIAL'
            ? '#FEE2E2'
            : '#FEF3C7',
        borderLeftWidth: 6,
        borderLeftColor:
          pendingPayment.payment_status === 'OVERDUE'
            ? '#EF4444'
            : pendingPayment.payment_status === 'PARTIAL'
            ? '#EF4444'
            : '#F59E0B' }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12 }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color:
              pendingPayment.payment_status === 'OVERDUE'
                ? '#DC2626'
                : pendingPayment.payment_status === 'PARTIAL'
                ? '#DC2626'
                : '#D97706' }}
        >
          {pendingPayment.payment_status === 'OVERDUE'
            ? '⚠️ OVERDUE PAYMENT'
            : pendingPayment.payment_status === 'PARTIAL'
            ? '⏳ PARTIAL PAYMENT'
            : '📅 PENDING PAYMENT'}
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color:
              pendingPayment.payment_status === 'OVERDUE'
                ? '#DC2626'
                : pendingPayment.payment_status === 'PARTIAL'
                ? '#DC2626'
                : '#D97706' }}
        >
          ₹{pendingPayment.total_pending}
        </Text>
      </View>

      {pendingPayment.overdue_months > 0 && (
        <Text style={{ fontSize: 13, color: '#DC2626', marginBottom: 6 }}>
          {pendingPayment.overdue_months} month(s) overdue
        </Text>
      )}

      {pendingPayment.next_due_date && (
        <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginBottom: 12 }}>
          Next due: {new Date(pendingPayment.next_due_date).toLocaleDateString()}
        </Text>
      )}

      {/* Pending Months Breakdown */}
      {pendingPayment.pending_months && pendingPayment.pending_months.length > 0 && (
        <View>
          <AnimatedPressableCard
            onPress={() => setExpandedMonths(!expandedMonths)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: '#00000020' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Monthly Breakdown
            </Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
              {expandedMonths ? '▼' : '▶'}
            </Text>
          </AnimatedPressableCard>

          {expandedMonths && (
            <View style={{ marginTop: 8 }}>
              {pendingPayment.pending_months.map((month: PendingPaymentMonth, index: number) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderBottomWidth: 1,
                    borderBottomColor: '#00000010' }}
                >
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                      {month.month} {month.year}
                    </Text>
                    <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>
                      Paid: ₹{month.paid_amount} / ₹{month.expected_amount}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: month.is_overdue ? '#DC2626' : '#D97706' }}
                    >
                      ₹{month.balance}
                    </Text>
                    {month.is_overdue && (
                      <Text style={{ fontSize: 10, color: '#DC2626' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Overdue</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
};
