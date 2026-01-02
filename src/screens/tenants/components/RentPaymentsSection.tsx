import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from '../../../components/AnimatedPressableCard';
import { CollapsibleSection } from '../../../components/CollapsibleSection';
import { Theme } from '../../../theme';
import { TenantPayment } from '@/services/api/tenantsApi';


interface RentPaymentsSectionProps {
  payments: TenantPayment[] | undefined;
  expanded: boolean;
  onToggle: () => void;
  onViewReceipt: (payment: TenantPayment) => void;
  onWhatsAppReceipt: (payment: TenantPayment) => void;
  onShareReceipt: (payment: TenantPayment) => void;
}

export const RentPaymentsSection: React.FC<RentPaymentsSectionProps> = ({
  payments,
  expanded,
  onToggle,
  onViewReceipt,
  onWhatsAppReceipt,
  onShareReceipt,
}) => {
  const getPeriod = (payment: any): { start?: string; end?: string } => {
    const start = payment?.tenant_rent_cycles?.cycle_start || payment?.start_date;
    const end = payment?.tenant_rent_cycles?.cycle_end || payment?.end_date;
    return { start, end };
  };

  return (
    <CollapsibleSection
      title="Rent Payments"
      icon="cash-outline"
      itemCount={payments?.length || 0}
      expanded={expanded}
      onToggle={onToggle}
      theme="light"
    >
          {payments && payments.length > 0 ? (
            payments.map((payment: TenantPayment) => (
              <AnimatedPressableCard
                key={payment.s_no}
                scaleValue={0.98}
                duration={120}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  marginBottom: 6,
                  marginHorizontal: 8,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: payment.status === 'PAID' ? '#10B981' : payment.status === 'PENDING' ? '#F59E0B' : payment.status === 'PARTIAL' ? '#3B82F6' : '#9CA3AF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                {/* Header Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.primary }}>
                      Payment Date
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.secondary, marginTop: 1 }}>
                      {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {payment.status && (
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: 
                          payment.status === 'PAID' ? '#10B98120' :
                          payment.status === 'PENDING' ? '#F59E0B20' :
                          payment.status === 'PARTIAL' ? '#3B82F620' : '#9CA3AF20',
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: 
                            payment.status === 'PAID' ? '#10B981' :
                            payment.status === 'PENDING' ? '#F59E0B' :
                            payment.status === 'PARTIAL' ? '#3B82F6' : '#6B7280',
                        }}>
                          {payment.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Amount Section */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 0.5,
                  borderTopColor: '#E5E7EB',
                  marginBottom: 6,
                }}>
                  <View>
                    <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 1 }}>
                      Amount Paid
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.primary }}>
                      ₹{payment.amount_paid?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {payment.actual_rent_amount && payment.actual_rent_amount !== payment.amount_paid && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 1 }}>
                        Actual Rent
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.secondary }}>
                        ₹{payment.actual_rent_amount?.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Details Grid */}
                <View style={{ gap: 4 }}>
                  {/* Payment Period */}
                  {(() => {
                    const period = getPeriod(payment as any);
                    if (!period.start || !period.end) return null;
                    return (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, width: 70 }}>
                        Period:
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary, flex: 1 }}>
                        {new Date(period.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(period.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    );
                  })()}

                  {/* Payment Method */}
                  {payment.payment_method && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, width: 80 }}>
                        Method:
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {payment.payment_method}
                      </Text>
                    </View>
                  )}

                  {/* Room & Bed */}
                  {((payment as any).rooms || (payment as any).beds) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, width: 80 }}>
                        Location:
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {(payment as any).rooms?.room_no && `Room ${(payment as any).rooms.room_no}`}
                        {(payment as any).rooms?.room_no && (payment as any).beds?.bed_no && ' • '}
                        {(payment as any).beds?.bed_no && `Bed ${(payment as any).beds.bed_no}`}
                      </Text>
                    </View>
                  )}

                  {/* Remarks */}
                  {payment.remarks && (
                    <View style={{ 
                      marginTop: 6, 
                      padding: 8, 
                      backgroundColor: '#FFF', 
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}>
                      <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 2, fontWeight: '600' }}>
                        REMARKS
                      </Text>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontStyle: 'italic' }}>
                        {payment.remarks}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Receipt Buttons */}
                {payment.status === 'PAID' && (
                  <View style={{ flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <TouchableOpacity
                      onPress={() => onViewReceipt(payment)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        backgroundColor: '#FEF3C7',
                        borderRadius: 8,
                        marginRight: 4,
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#F59E0B" />
                      <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                        View
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onWhatsAppReceipt(payment)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        backgroundColor: '#F0FDF4',
                        borderRadius: 8,
                        marginHorizontal: 4,
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onShareReceipt(payment)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        marginLeft: 4,
                      }}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#3B82F6" />
                      <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </AnimatedPressableCard>
            ))
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💵</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
                No Rent Payments
              </Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No rent payment records found for this tenant
              </Text>
            </View>
          )}
    </CollapsibleSection>
  );
};
