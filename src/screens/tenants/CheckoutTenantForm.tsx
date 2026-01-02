import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { DatePicker } from '../../components/DatePicker';
import { Theme } from '../../theme';
import { Tenant } from '../../types';

interface CheckoutTenantFormProps {
  tenant: Tenant;
  checkoutDate: string;
  onDateChange: (date: string) => void;
}

export const CheckoutTenantForm: React.FC<CheckoutTenantFormProps> = ({
  tenant,
  checkoutDate,
  onDateChange,
}) => {
  const getPeriod = (payment: any): { start?: string; end?: string } => {
    const start = payment?.tenant_rent_cycles?.cycle_start || payment?.start_date;
    const end = payment?.tenant_rent_cycles?.cycle_end || payment?.end_date;
    return { start, end };
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Tenant Information */}
      {tenant && (
        <View style={{
          marginHorizontal: 0,
          marginBottom: 16,
          padding: 12,
          backgroundColor: Theme.colors.background.blueLight,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: Theme.colors.primary,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: Theme.colors.primary,
            marginBottom: 8,
          }}>
            📋 Tenant Details
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{
              fontSize: 12,
              color: Theme.colors.text.tertiary,
              width: 100,
            }}>
              Check-in Date:
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: Theme.colors.text.primary,
            }}>
              {new Date(tenant.check_in_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          {tenant.check_out_date && (
            <View style={{ flexDirection: 'row' }}>
              <Text style={{
                fontSize: 12,
                color: Theme.colors.text.tertiary,
                width: 100,
              }}>
                Current Checkout:
              </Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: Theme.colors.text.primary,
              }}>
                {new Date(tenant.check_out_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Rent Periods */}
      {tenant?.rent_payments && tenant.rent_payments.length > 0 && (
        <View style={{
          marginHorizontal: 0,
          marginBottom: 16,
          padding: 12,
          backgroundColor: Theme.colors.background.blueLight,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: Theme.colors.primary,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: Theme.colors.primary,
            marginBottom: 8,
          }}>
            📋 Rent Periods
          </Text>
          {tenant.rent_payments.length > 2 ? (
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 120, }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {tenant.rent_payments.slice().reverse().map((payment: any) => (
                <View key={payment.s_no} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <Text style={{
                      fontSize: 12,
                      color: Theme.colors.text.tertiary,
                      width: 80,
                    }}>
                      Period:
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                      flex: 1,
                    }}>
                      {(() => {
                        const period = getPeriod(payment);
                        if (!period.start || !period.end) return 'N/A';
                        return `${new Date(period.start).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })} - ${new Date(period.end).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}`;
                      })()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{
                      fontSize: 12,
                      color: Theme.colors.text.tertiary,
                      width: 80,
                    }}>
                      Status:
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: payment.status === 'PAID' ? '#10B981' : payment.status === 'PARTIAL' ? '#F59E0B' : '#EF4444',
                    }}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <>
              {tenant.rent_payments.slice().reverse().map((payment: any) => (
              <View key={payment.s_no} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{
                    fontSize: 12,
                    color: Theme.colors.text.tertiary,
                    width: 80,
                  }}>
                    Period:
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: Theme.colors.text.primary,
                    flex: 1,
                  }}>
                    {(() => {
                      const period = getPeriod(payment);
                      if (!period.start || !period.end) return 'N/A';
                      return `${new Date(period.start).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })} - ${new Date(period.end).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}`;
                    })()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{
                    fontSize: 12,
                    color: Theme.colors.text.tertiary,
                    width: 80,
                  }}>
                    Status:
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: payment.status === 'PAID' ? '#10B981' : payment.status === 'PARTIAL' ? '#F59E0B' : '#EF4444',
            }}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* Checkout Date Picker */}
      <View style={{ marginBottom: 12 }}>
        <DatePicker
          label="Select Checkout Date"
          value={checkoutDate}
          onChange={onDateChange}
        />
      </View>
    </ScrollView>
  );
};
