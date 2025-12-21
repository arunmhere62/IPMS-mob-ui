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
      {tenant?.tenant_payments && tenant.tenant_payments.length > 0 && (
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
          {tenant.tenant_payments.length > 2 ? (
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 120, }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {tenant.tenant_payments.slice().reverse().map((payment: any) => (
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
                      {payment.start_date ? new Date(payment.start_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }) : 'N/A'} - {payment.end_date ? new Date(payment.end_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }) : 'N/A'}
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
              {tenant.tenant_payments.slice().reverse().map((payment: any) => (
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
                    {payment.start_date ? new Date(payment.start_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }) : 'N/A'} - {payment.end_date ? new Date(payment.end_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }) : 'N/A'}
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
