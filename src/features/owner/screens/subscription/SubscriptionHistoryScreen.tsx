import React, { useEffect } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Theme } from '@/theme';
import { CONTENT_COLOR } from '@/constant';
import {
  useGetSubscriptionHistoryQuery,
  useGetInvoicesQuery,
  UserSubscription,
  SubscriptionInvoice,
} from '@/features/owner/api/subscriptionApi';

interface SubscriptionHistoryScreenProps {
  navigation: any;
}

export const SubscriptionHistoryScreen: React.FC<SubscriptionHistoryScreenProps> = ({ navigation }) => {
  const {
    data: historyResponse,
    isLoading,
    isFetching,
    error,
    refetch } = useGetSubscriptionHistoryQuery();

  const {
    data: invoicesResponse,
    refetch: refetchInvoices,
  } = useGetInvoicesQuery();

  const history = historyResponse?.data || [];
  const invoices = invoicesResponse?.data || [];
  const [refreshing, setRefreshing] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [visibleItemsCount, setVisibleItemsCount] = React.useState(0);
  const flatListRef = React.useRef<any>(null);

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index || 0;
      setVisibleItemsCount(lastVisibleIndex + 1);
    }
  }, []);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100 });

  useEffect(() => {
    if (!error) {
      setFetchError(null);
      return;
    }

    const maybeData = (error as any)?.data;
    const message =
      (maybeData && (maybeData.message || maybeData.error)) ||
      (error as any)?.error ||
      'Unable to load subscription history. Please try again.';
    setFetchError(message);
  }, [error]);

  // Debug log
  useEffect(() => {
    console.log('📊 History state:', { history, isLoading, isFetching });
  }, [history, isLoading, isFetching]);

  const onRefresh = async () => {
    setRefreshing(true);
    setFetchError(null);
    await Promise.all([refetch(), refetchInvoices()]);

    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }

    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Theme.colors.secondary;
      case 'EXPIRED':
        return Theme.colors.danger;
      case 'CANCELLED':
        return Theme.colors.text.tertiary;
      case 'PENDING':
        return Theme.colors.warning;
      default:
        return Theme.colors.text.secondary;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return Theme.colors.secondary;
      case 'PENDING':
        return Theme.colors.warning;
      case 'FAILED':
        return Theme.colors.danger;
      default:
        return Theme.colors.text.secondary;
    }
  };

  const formatCurrency = (value: string | number | null | undefined): string => {
    if (value == null) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generateInvoiceHtml = (invoice: SubscriptionInvoice): string => {
    const inv = invoice;
    const pay = inv.subscription_payments;
    const isInterState = Number(inv.igst_rate ?? 0) > 0;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${inv.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #f9fafb; padding: 20px; }
    .invoice { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0f172a; color: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header .invoice-no { font-size: 14px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 32px; }
    .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
    .party { flex: 1; }
    .party h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
    .party .name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .party .detail { font-size: 13px; color: #4b5563; line-height: 1.5; }
    .party .gstin { font-size: 13px; color: #4b5563; margin-top: 4px; }
    .meta-table { width: 100%; margin-bottom: 24px; }
    .meta-table td { padding: 6px 0; font-size: 13px; }
    .meta-table td:first-child { color: #6b7280; width: 40%; }
    .meta-table td:last-child { font-weight: 600; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .totals { margin-left: auto; width: 300px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals .row.total { border-top: 2px solid #1f2937; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; }
    .totals .row .label { color: #6b7280; }
    .totals .row .value { font-weight: 600; }
    .footer { padding: 16px 32px 24px; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #6b7280; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .badge-active { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <h1>IPGM</h1>
        <div class="invoice-no">Tax Invoice</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 18px; font-weight: 700;">${inv.invoice_number}</div>
        <div class="invoice-no">${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</div>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        <div class="party">
          <h3>From (Seller)</h3>
          <div class="name">${inv.seller_legal_name}</div>
          <div class="detail">${inv.seller_address}</div>
          <div class="gstin">GSTIN: ${inv.seller_gstin}</div>
          <div class="detail">State Code: ${inv.seller_state_code}</div>
          ${inv.seller_duns_number ? `<div class="detail">DUNS: ${inv.seller_duns_number}</div>` : ''}
        </div>
        <div class="party">
          <h3>To (Buyer)</h3>
          <div class="name">${inv.buyer_name}</div>
          <div class="detail">${inv.buyer_address}</div>
          ${inv.buyer_gstin ? `<div class="gstin">GSTIN: ${inv.buyer_gstin}</div>` : ''}
          <div class="detail">State Code: ${inv.buyer_state_code}</div>
          <div class="detail">Place of Supply: ${inv.place_of_supply}</div>
        </div>
      </div>

      <table class="meta-table">
        <tr><td>Invoice Number</td><td>${inv.invoice_number}</td></tr>
        <tr><td>Invoice Date</td><td>${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td></tr>
        ${pay ? `<tr><td>Order ID</td><td>${pay.order_id}</td></tr>` : ''}
        ${pay?.payment_mode ? `<tr><td>Payment Mode</td><td>${pay.payment_mode}</td></tr>` : ''}
        ${pay?.tracking_id ? `<tr><td>Tracking ID</td><td>${pay.tracking_id}</td></tr>` : ''}
        <tr><td>Status</td><td><span class="badge badge-active">${inv.status}</span></td></tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>HSN/SAC</th>
            <th style="text-align: right;">Taxable Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${inv.service_description}</td>
            <td>${inv.hsn_sac_code}</td>
            <td style="text-align: right;">₹ ${formatCurrency(inv.taxable_value)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span class="label">Taxable Value</span><span class="value">₹ ${formatCurrency(inv.taxable_value)}</span></div>
        ${isInterState ? `
          <div class="row"><span class="label">IGST (${inv.igst_rate}%)</span><span class="value">₹ ${formatCurrency(inv.igst_amount)}</span></div>
        ` : `
          <div class="row"><span class="label">CGST (${inv.cgst_rate}%)</span><span class="value">₹ ${formatCurrency(inv.cgst_amount)}</span></div>
          <div class="row"><span class="label">SGST (${inv.sgst_rate}%)</span><span class="value">₹ ${formatCurrency(inv.sgst_amount)}</span></div>
        `}
        <div class="row total"><span>Total</span><span>₹ ${formatCurrency(inv.total_amount)}</span></div>
      </div>

      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
        ${inv.is_reverse_charge ? 'Reverse Charge Applied. ' : ''}All amounts are in INR (₹).
      </p>
    </div>
    <div class="footer">
      <p>This is a computer-generated invoice and does not require a physical signature.</p>
      <p>Thank you for choosing IPGM — Indian PG Management.</p>
    </div>
  </div>
</body>
</html>`;
  };

  const handleViewInvoice = (invoice: SubscriptionInvoice) => {
    const html = generateInvoiceHtml(invoice);
    navigation.navigate('InvoiceViewer', { html, invoiceNumber: invoice.invoice_number });
  };

  // Build a map of subscription_id -> invoice for quick lookup
  const invoiceBySubscriptionId = React.useMemo(() => {
    const map = new Map<number, SubscriptionInvoice>();
    for (const inv of invoices) {
      if (inv.subscription_id) {
        map.set(inv.subscription_id, inv);
      }
    }
    return map;
  }, [invoices]);

  const renderHistoryItem = ({ item }: { item: UserSubscription }) => {
    const plan = item.plan || item.subscription_plans;
    const subId = item.s_no ?? item.id;
    const invoice = subId != null ? invoiceBySubscriptionId.get(subId) : undefined;

    return (
    <Card style={{ marginBottom: 12, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
            {plan?.name || 'Unknown Plan'}
          </Text>
          <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>
            {plan?.description || ''}
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          backgroundColor: Theme.withOpacity(getStatusColor(item.status), 0.1) }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: getStatusColor(item.status) }}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={{ 
        backgroundColor: Theme.colors.background.secondary, 
        padding: 12, 
        borderRadius: 8,
        marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Start Date</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
            {formatDate(item.start_date)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>End Date</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
            {formatDate(item.end_date)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Amount Paid</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.primary }}>
            ₹{(item.amount_paid || plan?.price || 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Duration</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
            {plan?.duration || 0} days
          </Text>
        </View>
      </View>

      {/* Payment Status */}
      {item.payment_status && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={item.payment_status === 'PAID' ? 'checkmark-circle' : item.payment_status === 'PENDING' ? 'time' : 'close-circle'} 
              size={18} 
              color={getPaymentStatusColor(item.payment_status || 'PENDING')} 
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>
              Payment: <Text style={{ fontWeight: '600', color: getPaymentStatusColor(item.payment_status || 'PENDING') }}>
                {item.payment_status}
              </Text>
            </Text>
          </View>
          
          {item.status === 'ACTIVE' && (
            <AnimatedPressableCard
              onPress={() => navigation.navigate('SubscriptionPlans')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: Theme.colors.background.blueLight }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                Manage
              </Text>
            </AnimatedPressableCard>
          )}
        </View>
      )}

      {/* View Invoice */}
      {invoice && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 12 }}>
          <AnimatedPressableCard
            onPress={() => handleViewInvoice(invoice)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: Theme.colors.primary,
              gap: 6,
            }}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
              View Invoice
            </Text>
          </AnimatedPressableCard>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, textAlign: 'center', marginTop: 6 }}>
            {invoice.invoice_number}
          </Text>
        </View>
      )}
    </Card>
    );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title="Subscription History"
        subtitle={history ? `${history.length} subscriptions` : ''}
        backgroundColor={Theme.colors.background.blue}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        <ErrorBanner
          error={fetchError}
          title="Error Loading Subscription History"
          onRetry={() => {
            setFetchError(null);
            refetch();

            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            }
          }}
        />

        <FlatList
          ref={flatListRef}
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.s_no?.toString() || item.id?.toString() || Math.random().toString()}
          style={{ backgroundColor: CONTENT_COLOR }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            (isLoading || isFetching) ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
                  Loading history...
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 16 }}>
                  No Subscription History
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                  You haven't subscribed to any plan yet
                </Text>
                <AnimatedPressableCard
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                  style={{
                    marginTop: 24,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: Theme.colors.primary,
                    borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    View Plans
                  </Text>
                </AnimatedPressableCard>
              </View>
            )
          }
        />
      </View>

      {/* Scroll Position Indicator */}
      {visibleItemsCount > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 160,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          zIndex: 1000,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5 }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center' }}>
            {visibleItemsCount} of {history.length}
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#fff',
            opacity: 0.8,
            textAlign: 'center',
            marginTop: 2 }}>
            {history.length - visibleItemsCount} remaining
          </Text>
        </View>
      )}
    </ScreenLayout>
  );
};
