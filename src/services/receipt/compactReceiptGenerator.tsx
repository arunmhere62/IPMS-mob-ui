import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Linking, Alert } from 'react-native';

interface ReceiptData {
  receiptNumber: string;
  paymentDate: Date;
  tenantName: string;
  tenantPhone: string;
  pgName: string;
  roomNumber: string;
  bedNumber: string;
  rentPeriod: {
    startDate: Date;
    endDate: Date;
  };
  actualRent: number;
  amountPaid: number;
  paymentMethod: string;
  remarks?: string;
  receiptType?: 'RENT' | 'ADVANCE' | 'REFUND';
}

export class CompactReceiptGenerator {
  /**
   * Generate compact receipt component (Flipkart/Amazon style)
   */
  static ReceiptComponent = ({ data }: { data: ReceiptData }) => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.companyName}>PG Management</Text>
          <Text style={styles.receiptTitle}>
            {data.receiptType === 'ADVANCE'
              ? 'ADVANCE RECEIPT'
              : data.receiptType === 'REFUND'
                ? 'REFUND RECEIPT'
                : 'RENT RECEIPT'}
          </Text>
        </View>

        {/* Receipt Number & Date */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Receipt #</Text>
            <Text style={styles.infoValue}>{data.receiptNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.paymentDate)}</Text>
          </View>
        </View>

        {/* Tenant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TENANT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{data.tenantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{data.tenantPhone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{data.pgName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Room/Bed</Text>
            <Text style={styles.value}>{data.roomNumber} / {data.bedNumber}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{data.receiptType === 'REFUND' ? 'Date' : 'Period'}</Text>
            <Text style={styles.valueSmall}>
              {data.receiptType === 'REFUND'
                ? formatDate(data.paymentDate)
                : `${formatDate(data.rentPeriod.startDate)} - ${formatDate(data.rentPeriod.endDate)}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Method</Text>
            <Text style={styles.value}>{data.paymentMethod}</Text>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {data.receiptType === 'ADVANCE'
                ? 'Advance Amount'
                : data.receiptType === 'REFUND'
                  ? 'Refund Amount'
                  : 'Rent Amount'}
            </Text>
            <Text style={styles.amountValue}>₹{data.actualRent.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{data.receiptType === 'REFUND' ? 'Refunded' : 'Amount Paid'}</Text>
            <Text style={styles.totalValue}>₹{data.amountPaid.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
          <Text style={styles.footerContact}>📞 +91 1234567890 | ✉️ info@pgmanagement.com</Text>
        </View>
      </View>
    );
  };

  /**
   * Capture receipt as image and share via WhatsApp
   */
  static async shareViaWhatsApp(
    receiptRef: React.RefObject<View | null>,
    data: ReceiptData,
    phoneNumber: string
  ): Promise<void> {
    try {
      if (!receiptRef.current) {
        throw new Error('Receipt view is not ready yet');
      }
      // Capture receipt as image
      const uri = await captureRef(receiptRef.current, {
        format: 'png',
        quality: 1,
      });

      // WhatsApp message
      const receiptTitle = data.receiptType === 'ADVANCE'
        ? 'Advance Receipt'
        : data.receiptType === 'REFUND'
          ? 'Refund Receipt'
          : 'Rent Receipt';

      const periodLine = data.receiptType === 'REFUND'
        ? `*Date:* ${new Date(data.paymentDate).toLocaleDateString('en-IN')}`
        : `*Period:* ${new Date(data.rentPeriod.startDate).toLocaleDateString('en-IN')} - ${new Date(data.rentPeriod.endDate).toLocaleDateString('en-IN')}`;

      const message = `
🏠 *PG Management - ${receiptTitle}*

Hello ${data.tenantName},

*Receipt:* ${data.receiptNumber}
*Amount:* ₹${data.amountPaid.toLocaleString('en-IN')}
${periodLine}

Receipt attached.

Best regards,
PG Management Team
      `.trim();

      const encodedMessage = encodeURIComponent(message);
      const formattedNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      
      // Open WhatsApp with image
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        // First share the image
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Receipt',
        });
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw error;
    }
  }

  /**
   * Share receipt image
   */
  static async shareImage(receiptRef: React.RefObject<View | null>): Promise<void> {
    try {
      if (!receiptRef.current) {
        throw new Error('Receipt view is not ready yet');
      }

      const uri = await captureRef(receiptRef.current, {
        format: 'png',
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw error;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 12,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  receiptTitle: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1.5,
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 10,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#D1D5DB',
  },
  infoLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  amountSection: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: '#10B981',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#10B98140',
  },
  totalLabel: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  footer: {
    padding: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 3,
  },
  footerContact: {
    fontSize: 8,
    color: '#9CA3AF',
  },
});
