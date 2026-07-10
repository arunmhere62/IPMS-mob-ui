import React from 'react';
import { View, Text } from 'react-native';
import type { ReceiptData } from './receiptTypes';
import {
  ReceiptColors,
  receiptStyles,
  formatDate,
  formatInr,
  formatTenantAddress,
  formatPgAddress,
} from './receiptStyles';

export const RentReceipt: React.FC<{ data: ReceiptData }> = ({ data }) => {
  const pgAddressLine = formatPgAddress(data.pgDetails);
  const tenantAddressLine = formatTenantAddress(data);
  const tenantEmail = data.tenantEmail || 'N/A';
  const tenantWhatsapp = data.tenantWhatsapp || 'N/A';

  return (
    <View style={receiptStyles.container}>
      <View style={receiptStyles.header}>
        <View>
          <Text style={receiptStyles.brandName}>{data.pgName}</Text>
          <Text style={receiptStyles.brandAddress}>{pgAddressLine}</Text>
        </View>
        <View style={receiptStyles.titleRow}>
          <Text style={receiptStyles.title}>Rent Receipt</Text>
          <View style={[receiptStyles.statusBadge, { backgroundColor: ReceiptColors.success }]}>
            <Text style={[receiptStyles.statusText, { color: '#FFFFFF' }]}>Paid</Text>
          </View>
        </View>
      </View>

      <View style={receiptStyles.metaRow}>
        <View style={receiptStyles.metaItem}>
          <Text style={receiptStyles.metaLabel}>Receipt Number</Text>
          <Text style={receiptStyles.metaValue}>{data.receiptNumber}</Text>
        </View>
      </View>

      <View style={receiptStyles.body}>
        <View style={receiptStyles.section}>
          <Text style={receiptStyles.sectionTitle}>Tenant Details</Text>
          <View style={receiptStyles.infoGrid}>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Name</Text>
              <Text style={receiptStyles.infoValue}>{data.tenantName}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Phone</Text>
              <Text style={receiptStyles.infoValue}>{data.tenantPhone}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Email</Text>
              <Text style={receiptStyles.infoValue}>{tenantEmail}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>WhatsApp</Text>
              <Text style={receiptStyles.infoValue}>{tenantWhatsapp}</Text>
            </View>
            <View style={receiptStyles.infoItemFull}>
              <Text style={receiptStyles.infoLabel}>Address</Text>
              <Text style={receiptStyles.infoValueMultiline}>{tenantAddressLine}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Room / Bed</Text>
              <Text style={receiptStyles.infoValue}>Room {data.roomNumber} / Bed {data.bedNumber}</Text>
            </View>
          </View>
        </View>

        <View style={receiptStyles.divider} />

        <View style={receiptStyles.section}>
          <Text style={receiptStyles.sectionTitle}>Payment Details</Text>
          <View style={receiptStyles.infoGrid}>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Payment Date</Text>
              <Text style={receiptStyles.infoValue}>{formatDate(data.paymentDate)}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Payment Method</Text>
              <Text style={receiptStyles.infoValue}>{data.paymentMethod}</Text>
            </View>
          </View>
        </View>

        <View style={receiptStyles.divider} />

        <View style={receiptStyles.section}>
          <Text style={receiptStyles.sectionTitle}>Rent Period</Text>
          <View style={receiptStyles.infoGrid}>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>Start Date</Text>
              <Text style={receiptStyles.infoValue}>{formatDate(data.rentPeriod.startDate)}</Text>
            </View>
            <View style={receiptStyles.infoItemHalf}>
              <Text style={receiptStyles.infoLabel}>End Date</Text>
              <Text style={receiptStyles.infoValue}>{formatDate(data.rentPeriod.endDate)}</Text>
            </View>
          </View>
        </View>

        <View style={receiptStyles.divider} />

        <View style={receiptStyles.amountSection}>
          <View style={receiptStyles.amountRow}>
            <Text style={receiptStyles.amountLabel}>Rent Amount</Text>
            <Text style={receiptStyles.amountValue}>{formatInr(data.actualRent)}</Text>
          </View>
          <View style={receiptStyles.totalRow}>
            <Text style={receiptStyles.totalLabel}>Amount Paid</Text>
            <Text style={receiptStyles.totalValue}>{formatInr(data.amountPaid)}</Text>
          </View>
        </View>

        {data.remarks ? (
          <View style={[receiptStyles.section, { marginTop: 20 }]}>
            <Text style={receiptStyles.sectionTitle}>Remarks</Text>
            <View style={receiptStyles.remarksBox}>
              <Text style={receiptStyles.remarks}>{data.remarks}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={receiptStyles.footer}>
        <Text style={receiptStyles.footerText}>
          This is a system-generated receipt. For queries, contact PG management.
        </Text>
      </View>
    </View>
  );
};
