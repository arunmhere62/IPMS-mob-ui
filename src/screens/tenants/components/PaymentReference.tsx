import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Theme } from "../../../theme";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import type { Payment } from "@/types";

export type PaymentWithCycle = Payment & {
  tenant_rent_cycles?: {
    cycle_start?: string;
    cycle_end?: string;
  };
};

interface PaymentReferenceProps {
  checkingGaps: boolean;
  joiningDate?: string;
  lastPaymentStartDate?: string;
  lastPaymentEndDate?: string;
  previousPayments?: PaymentWithCycle[];
  bedRentAmount: number;
  fetchingBedPrice: boolean;
  rentCycleType?: 'CALENDAR' | 'MIDMONTH' | null;
  amountToPay?: number;
  amountPaid?: number;
  showAmountToPay?: boolean;
}

const getPaymentPeriod = (p: PaymentWithCycle): { start?: string; end?: string } => {
  const start = p.tenant_rent_cycles?.cycle_start || p.start_date;
  const end = p.tenant_rent_cycles?.cycle_end || p.end_date;
  return { start, end };
};

const getPaymentPeriodEndTime = (p: PaymentWithCycle): number => {
  const period = getPaymentPeriod(p);
  const v = period.end || p.payment_date;
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

const renderCalendarRentCycleInfo = () => (
  <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
    <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Rent Cycle:</Text>
    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.primary, flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
      📅 Calendar (1st - Last day)
    </Text>
  </View>
);

const renderMidmonthRentCycleInfo = () => (
  <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
    <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Rent Cycle:</Text>
    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.primary, flex: 1 }} numberOfLines={2} ellipsizeMode="tail">
      🔄 Mid-Month (Any day - Same day next month - 1)
    </Text>
  </View>
);

export const PaymentReference: React.FC<PaymentReferenceProps> = ({
  checkingGaps,
  joiningDate,
  lastPaymentStartDate,
  lastPaymentEndDate,
  previousPayments = [],
  bedRentAmount,
  fetchingBedPrice,
  rentCycleType,
  amountToPay,
  amountPaid,
  showAmountToPay,
}) => {
  if (!(joiningDate || lastPaymentStartDate || lastPaymentEndDate || bedRentAmount > 0)) return null;

  return (
    <View
      style={{
        marginHorizontal: 0,
        marginBottom: 20,
        padding: 16,
        backgroundColor: Theme.colors.canvas,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: Theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: Theme.colors.primary,
          }}
        >
          <Text style={{ fontSize: 16 }}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary }}>Payment Reference</Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: Theme.colors.text.tertiary }}>
            Use this info to verify period and rent.
          </Text>
        </View>
      </View>

      {checkingGaps ? (
        <View style={{ gap: 12 }}>
          <SkeletonLoader width="55%" height={14} borderRadius={6} />
          <SkeletonLoader width="90%" height={14} borderRadius={6} />
          <SkeletonLoader width="70%" height={14} borderRadius={6} />
          <SkeletonLoader width="85%" height={14} borderRadius={6} />
        </View>
      ) : (
        <>
          {typeof joiningDate === 'string' && joiningDate ? (
            <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Joining Date:</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {new Date(joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          ) : null}

          {previousPayments && previousPayments.length > 0 ? (
            (() => {
              const mostRecentPayment = previousPayments.reduce((latest, current) => {
                const latestEndDate = getPaymentPeriodEndTime(latest);
                const currentEndDate = getPaymentPeriodEndTime(current);
                return currentEndDate > latestEndDate ? current : latest;
              });

              const period = getPaymentPeriod(mostRecentPayment);
              return (
                <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Last Payment:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {period.start && period.end ? (
                      <>
                        {new Date(period.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {new Date(period.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Text>
                </View>
              </View>
              );
            })()
          ) : lastPaymentStartDate && lastPaymentEndDate ? (
            <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Last Payment:</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {new Date(lastPaymentStartDate || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {' - '}
                  {new Date(lastPaymentEndDate || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          ) : null}

          {bedRentAmount > 0 && (
            <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110 }}>Bed Rent Amount:</Text>
              <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.primary }}>
                {fetchingBedPrice ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                ) : (
                  `₹${bedRentAmount.toLocaleString('en-IN')}`
                )}
              </Text>
            </View>
            </View>
          )}
          {/* Rent Cycle Info */}
          {rentCycleType === 'CALENDAR' ? renderCalendarRentCycleInfo() : null}
          {rentCycleType === 'MIDMONTH' ? renderMidmonthRentCycleInfo() : null}
          {/* Amount To Pay - Enhanced */}
          {showAmountToPay && Number.isFinite(amountToPay ?? NaN) && (amountToPay ?? 0) > 0 ? (
            <View
              style={{
                marginTop: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: Theme.colors.background.blueLight,
                borderWidth: 1,
                borderColor: Theme.colors.background.blueMedium,
                borderRadius: 10,
                shadowColor: Theme.colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Amount to Pay
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.colors.primary }}>
                ₹{Number(amountToPay || 0).toLocaleString('en-IN')}
              </Text>
              {(() => {
                const expected = Number(amountToPay || 0);
                const paid = Number(amountPaid || 0);
                if (!Number.isFinite(expected) || expected <= 0) return null;
                if (!Number.isFinite(paid)) return null;
                if (Math.abs(paid - expected) < 0.01) return null;
                const remaining = Math.max(0, expected - paid);
                const label = paid > 0 ? `Remaining: ₹${remaining.toLocaleString('en-IN')}` : `Due: ₹${expected.toLocaleString('en-IN')}`;
                return (
                  <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '700', color: Theme.colors.primary }}>
                    {label}
                  </Text>
                );
              })()}
            </View>
          ) : null}

          

          {/* Previous Payments List */}
          {previousPayments && previousPayments.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border }}>
              <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
                PREVIOUS PAYMENTS
              </Text>
              {previousPayments
                .sort((a, b) => getPaymentPeriodEndTime(b) - getPaymentPeriodEndTime(a))
                .slice(0, 3)
                .map((prevPayment, index) => (
                  <View key={prevPayment.s_no || index} style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, width: 110, marginTop: 2 }}>
                      {index === 0 ? 'Most Recent:' : `${index + 1} ago:`}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 2 }}>
                        {(() => {
                          const p = getPaymentPeriod(prevPayment);
                          if (!p.start || !p.end) return 'N/A';
                          return `${new Date(p.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(p.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                        })()}
                      </Text>
                      <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                        ₹{prevPayment.amount_paid?.toLocaleString('en-IN')} • {prevPayment.status}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};
