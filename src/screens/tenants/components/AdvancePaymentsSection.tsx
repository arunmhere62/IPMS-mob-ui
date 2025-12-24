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
import { AdvancePayment } from '@/services/api/tenantsApi';

interface AdvancePaymentsSectionProps {
  payments: AdvancePayment[] | undefined;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (payment: AdvancePayment) => void;
  onDelete: (payment: AdvancePayment) => void;
  onViewReceipt: (payment: AdvancePayment) => void;
  onWhatsAppReceipt: (payment: AdvancePayment) => void;
  onShareReceipt: (payment: AdvancePayment) => void;
}

export const AdvancePaymentsSection: React.FC<AdvancePaymentsSectionProps> = ({
  payments,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onViewReceipt,
  onWhatsAppReceipt,
  onShareReceipt,
}) => {
  const totalAdvance = payments?.reduce((sum: number, p: AdvancePayment) => sum + parseFloat(p.amount_paid.toString()), 0) || 0;

  return (
    <CollapsibleSection
      title="Advance Payments"
      icon="wallet-outline"
      itemCount={payments?.length || 0}
      expanded={expanded}
      onToggle={onToggle}
      theme="lightGreen"
    >
          {payments && payments.length > 0 ? (
            <>
              {payments.map((payment: AdvancePayment) => (
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
                    borderLeftColor: payment.status === 'PAID' ? '#10B981' : payment.status === 'PENDING' ? '#F59E0B' : payment.status === 'FAILED' ? '#EF4444' : payment.status === 'REFUNDED' ? '#3B82F6' : '#9CA3AF',
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
                      <TouchableOpacity
                        onPress={() => onEdit(payment)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: Theme.colors.background.blueLight,
                        }}
                      >
                        <Ionicons name="pencil" size={16} color={Theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDelete(payment)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: '#FEE2E2',
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                      {payment.status && (
                        <View style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          backgroundColor: 
                            payment.status === 'PAID' ? '#10B98120' :
                            payment.status === 'PENDING' ? '#F59E0B20' :
                            payment.status === 'FAILED' ? '#EF444420' :
                            payment.status === 'REFUNDED' ? '#3B82F620' : '#9CA3AF20',
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: 
                              payment.status === 'PAID' ? '#10B981' :
                              payment.status === 'PENDING' ? '#F59E0B' :
                              payment.status === 'FAILED' ? '#EF4444' :
                              payment.status === 'REFUNDED' ? '#3B82F6' : '#6B7280',
                          }}>
                            {payment.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Amount Section */}
                  <View style={{ 
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#D1FAE5',
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 2 }}>
                      Advance Amount
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
                      ₹{payment.amount_paid?.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Details */}
                  <View style={{ gap: 6 }}>
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
                        borderColor: '#D1FAE5',
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

                  {/* Receipt Buttons - Only show for PAID status */}
                  {payment.status === 'PAID' && (
                    <View style={{ flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#D1FAE5' }}>
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
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B', marginLeft: 4 }}>
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
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981', marginLeft: 4 }}>
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
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6', marginLeft: 4 }}>
                          Share
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </AnimatedPressableCard>
              ))}

              {/* Total Advance Summary */}
              <View style={{ 
                paddingVertical: 12, 
                paddingHorizontal: 16,
                borderTopWidth: 2, 
                borderTopColor: '#10B981', 
                marginTop: 8,
                backgroundColor: '#ECFDF5',
                borderRadius: 8,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#047857' }}>
                    Total Advance Paid
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
                    ₹{totalAdvance.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💰</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#10B981', marginBottom: 4 }}>
                No Advance Payments
              </Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No advance payment records found for this tenant
              </Text>
            </View>
          )}
    </CollapsibleSection>
  );
};
