import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { AnimatedPressableCard } from '../../../components/AnimatedPressableCard';
import { CollapsibleSection } from '../../../components/CollapsibleSection';
import { Theme } from '../../../theme';
import { CurrentBill } from '@/services/api/tenantsApi';

interface CurrentBillsSectionProps {
  bills: CurrentBill[] | undefined;
  expanded: boolean;
  onToggle: () => void;
}

export const CurrentBillsSection: React.FC<CurrentBillsSectionProps> = ({
  bills,
  expanded,
  onToggle,
}) => {
  const totalBills =
    bills?.reduce(
      (sum: number, bill: CurrentBill) =>
        sum + parseFloat(bill.bill_amount.toString()),
      0
    ) || 0;

  return (
    <CollapsibleSection
      title="Current Bills"
      icon="document-text-outline"
      itemCount={bills?.length || 0}
      expanded={expanded}
      onToggle={onToggle}
      theme="light"
    >
      {bills && bills.length > 0 ? (
        <>
          {bills.map((bill: CurrentBill) => (
            <AnimatedPressableCard
              key={bill.s_no}
              scaleValue={0.97}
              duration={120}
              style={{
                marginBottom: 12,
                marginHorizontal: 12,
                padding: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#EDE9FE',
                shadowColor: '#4C1D95',
                shadowOpacity: 0.05,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: Theme.colors.text.primary,
                    }}
                  >
                    Bill Date
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: Theme.colors.text.secondary,
                    }}
                  >
                    {new Date(bill.bill_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: Theme.colors.text.tertiary,
                    }}
                  >
                    Bill Amount
                  </Text>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: '#7C3AED',
                    }}
                  >
                    ₹{parseFloat(bill.bill_amount.toString()).toLocaleString(
                      'en-IN'
                    )}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: '#F3E8FF',
                  marginVertical: 10,
                }}
              />

              {/* Created */}
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    width: 80,
                    color: Theme.colors.text.tertiary,
                  }}
                >
                  Created:
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: Theme.colors.text.primary,
                  }}
                >
                  {new Date(bill.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Updated */}
              {bill.updated_at && (
                <View style={{ flexDirection: 'row' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      width: 80,
                      color: Theme.colors.text.tertiary,
                    }}
                  >
                    Updated:
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                    }}
                  >
                    {new Date(bill.updated_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            </AnimatedPressableCard>
          ))}

          {/* Total Bill Summary */}
          <View
            style={{
              padding: 16,
              marginTop: 12,
              marginHorizontal: 12,
              backgroundColor: '#F5F3FF',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EDE9FE',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#5B21B6',
                }}
              >
                Total Current Bills
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#7C3AED',
                }}
              >
                ₹{totalBills.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </>
      ) : (
        // No Data UI
        <View
          style={{ paddingVertical: 40, alignItems: 'center', opacity: 0.8 }}
        >
          <Text style={{ fontSize: 50, marginBottom: 12 }}>📄</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: Theme.colors.text.primary,
              marginBottom: 6,
            }}
          >
            No Current Bills
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Theme.colors.text.secondary,
              textAlign: 'center',
              paddingHorizontal: 30,
            }}
          >
            This tenant has no active current bills at the moment.
          </Text>
        </View>
      )}
    </CollapsibleSection>
  );
};
