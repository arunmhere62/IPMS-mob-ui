import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { Card } from '../../components/Card';
import type { DashboardMonthlyMetricsResponse } from '../../services/api/dashboardApi';
import { SlideBottomModal } from '../../components/SlideBottomModal';

interface MonthlyMetricsCardProps {
  monthlyMetrics?: DashboardMonthlyMetricsResponse['data'];
  isFetching: boolean;
  onDateRangeChange: (monthStart?: string, monthEnd?: string) => void;
  formatCurrency: (amount?: number) => string;
}

const getLast6Months = () => {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    // Important: backend expects an exclusive end date (first day of next month)
    const nextMonthFirstDay = new Date(year, month + 1, 1).toISOString().split('T')[0];
    
    months.push({
      label: monthName,
      monthStart: firstDay,
      monthEnd: nextMonthFirstDay,
      isCurrentMonth: i === 0,
    });
  }
  
  return months;
};

export const MonthlyMetricsCard: React.FC<MonthlyMetricsCardProps> = ({
  monthlyMetrics,
  isFetching,
  onDateRangeChange,
  formatCurrency,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getLast6Months()[0]);
  const [showInfo, setShowInfo] = useState(false);

  const months = getLast6Months();

  const handleSelectMonth = (month: typeof months[0]) => {
    setSelectedMonth(month);
    setShowDropdown(false);
    onDateRangeChange(month.monthStart, month.monthEnd);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showDropdown) {
      const timeout = setTimeout(() => {
        setShowDropdown(false);
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timeout);
    }
  }, [showDropdown]);

  const mm = monthlyMetrics?.monthly_metrics;
  const cashReceived = mm?.cash_received ?? 0;
  const rentEarned = mm?.rent_earned ?? 0;
  const refundsPaid = mm?.refunds_paid ?? 0;
  const advancePaid = mm?.advance_paid ?? 0;
  const expensesPaid = mm?.expenses_paid ?? 0;
  const mrrValue = mm?.mrr_value ?? 0;
  const collectionRate = rentEarned > 0 ? cashReceived / rentEarned : 0;
  const collectionRateText = `${(collectionRate * 100).toFixed(1)}%`;
  const collectionRateColor = collectionRate >= 0.9 ? '#10B981' : collectionRate >= 0.7 ? '#F59E0B' : '#EF4444';

  const tileBg = Theme.colors.light;
  const tileBorder = Theme.colors.border;
  const tileRadius = 14;
  const tilePad = 12;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
      <Card
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          backgroundColor: Theme.colors.background.secondary,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.12),
                borderWidth: 1,
                borderColor: Theme.withOpacity(Theme.colors.primary, 0.18),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="bar-chart" size={16} color={Theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Theme.colors.text.primary, fontSize: 15, fontWeight: '900' }}>
                Monthly Metrics
              </Text>
              <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, marginTop: 2 }}>
                {isFetching ? 'Loading…' : selectedMonth.label}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowInfo(true)}
            activeOpacity={0.9}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: Theme.colors.light,
              borderWidth: 1,
              borderColor: Theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Ionicons name="help-circle-outline" size={18} color={Theme.colors.text.secondary} />
          </TouchableOpacity>

          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.9}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: Theme.colors.light,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <Ionicons name="calendar-outline" size={14} color={Theme.colors.text.secondary} />
              <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '800' }}>
                {selectedMonth.label}
              </Text>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={12} color={Theme.colors.text.secondary} />
            </TouchableOpacity>

            {showDropdown && (
              <View
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.14,
                  shadowRadius: 12,
                  elevation: 10,
                  zIndex: 1000,
                  minWidth: 170,
                  overflow: 'hidden',
                }}
              >
                {months.map((month, index) => {
                  const active = selectedMonth.label === month.label;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: active ? Theme.withOpacity(Theme.colors.primary, 0.10) : 'transparent',
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: Theme.colors.border,
                      }}
                      onPress={() => handleSelectMonth(month)}
                      activeOpacity={0.9}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: Theme.withOpacity(Theme.colors.primary, active ? 0.14 : 0.08),
                            borderWidth: 1,
                            borderColor: Theme.withOpacity(Theme.colors.primary, active ? 0.20 : 0.12),
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="calendar-outline" size={13} color={Theme.colors.primary} />
                        </View>
                        <View>
                          <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '800' }}>
                            {month.label}
                          </Text>
                          {month.isCurrentMonth && (
                            <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, marginTop: 1 }}>
                              Current
                            </Text>
                          )}
                        </View>
                      </View>
                      {active && <Ionicons name="checkmark" size={16} color={Theme.colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {monthlyMetrics && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Collected</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity('#10B981', 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity('#10B981', 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="cash" size={14} color={'#10B981'} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(cashReceived)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Rent Due</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity(Theme.colors.primary, 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="receipt" size={14} color={Theme.colors.primary} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(rentEarned)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Refunds Paid</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity('#EF4444', 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity('#EF4444', 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="return-down-back" size={14} color={'#EF4444'} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(refundsPaid)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Monthly Rent Value</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity('#0EA5E9', 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity('#0EA5E9', 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="trending-up" size={14} color={'#0EA5E9'} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(mrrValue)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Advance Paid</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity('#8B5CF6', 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity('#8B5CF6', 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="wallet" size={14} color={'#8B5CF6'} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(advancePaid)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: tileBg,
                  borderRadius: tileRadius,
                  padding: tilePad,
                  borderWidth: 1,
                  borderColor: tileBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '900' }}>Expenses</Text>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: Theme.withOpacity('#F97316', 0.10),
                      borderWidth: 1,
                      borderColor: Theme.withOpacity('#F97316', 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="card" size={14} color={'#F97316'} />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 10 }}>
                  {formatCurrency(expensesPaid)}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 10,
                backgroundColor: Theme.withOpacity(collectionRateColor, 0.08),
                borderRadius: tileRadius,
                padding: 12,
                borderWidth: 1,
                borderColor: Theme.withOpacity(collectionRateColor, 0.16),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: Theme.withOpacity(collectionRateColor, 0.12),
                    borderWidth: 1,
                    borderColor: Theme.withOpacity(collectionRateColor, 0.18),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pie-chart" size={14} color={collectionRateColor} />
                </View>
                <View>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '900' }}>Collected %</Text>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, marginTop: 2 }}>Collected ÷ Rent due</Text>
                </View>
              </View>

              <Text style={{ color: collectionRateColor, fontSize: 16, fontWeight: '900' }}>
                {collectionRateText}
              </Text>
            </View>
          </View>
        )}

        {!monthlyMetrics && !isFetching && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Ionicons name="bar-chart-outline" size={40} color={Theme.colors.text.secondary} />
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 14, marginTop: 8 }}>
              No monthly data available
            </Text>
          </View>
        )}
      </Card>

      <SlideBottomModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title="Monthly metrics explained"
        subtitle={selectedMonth?.label ? `For ${selectedMonth.label}` : undefined}
        submitLabel="Got it"
        onSubmit={() => setShowInfo(false)}
      >
        <View style={{ gap: 14 }}>
          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Collected</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Money that actually came in during this month.
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Rent Due</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Rent that belongs to this month based on the tenant’s stay (even if paid later).
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Refunds Paid</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Total refunds paid to tenants inside this month (cash-out).
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Advance Paid</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Total advance payments received during this month.
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Expenses</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Total expenses recorded for this month.
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Monthly Rent Value</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Your monthly rent value for this month based on currently occupied beds (a monthly baseline).
            </Text>
          </View>

          <View>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Collected %</Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Shows how much of the month’s rent due was collected.
            </Text>
          </View>
        </View>
      </SlideBottomModal>
    </View>
  );
};
