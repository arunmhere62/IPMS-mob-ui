import React from 'react';
import { View, PixelRatio } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Linking, Alert } from 'react-native';

import { RentReceipt } from './RentReceipt';
import { AdvanceReceipt } from './AdvanceReceipt';
import { RefundReceipt } from './RefundReceipt';
import type { ReceiptData } from './receiptTypes';

export class CompactReceiptGenerator {
  /**
   * Generate compact receipt component (Flipkart/Amazon style)
   */
  static ReceiptComponent = ({ data }: { data: ReceiptData }) => {
    if (data.receiptType === 'ADVANCE') return <AdvanceReceipt data={data} />;
    if (data.receiptType === 'REFUND') return <RefundReceipt data={data} />;
    return <RentReceipt data={data} />;
  };

  private static async captureReceiptImage(receiptView: View): Promise<string> {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      try {
        receiptView.measure((_x, _y, w, h) => resolve({ width: w, height: h }));
      } catch (e) {
        reject(e);
      }
    });

    const exportScale = 3;
    const pxScale = PixelRatio.get() * exportScale;
    const targetWidth = Math.max(1, Math.round(width * pxScale));
    const targetHeight = Math.max(1, Math.round(height * pxScale));

    return captureRef(receiptView, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      width: targetWidth,
      height: targetHeight,
    });
  }

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
      const uri = await CompactReceiptGenerator.captureReceiptImage(receiptRef.current);

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

      const uri = await CompactReceiptGenerator.captureReceiptImage(receiptRef.current);

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
