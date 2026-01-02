import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { DatePicker } from '../../components/DatePicker';
import { AmountInput } from '../../components/AmountInput';
import { OptionSelector, Option } from '../../components/OptionSelector';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { ActionTile } from '../../components/ActionButtons';
import { CONTENT_COLOR } from '@/constant';
import RentPaymentForm from './RentPaymentForm';
import { AddRefundPaymentModal } from './AddRefundPaymentModal';
import { EditRefundPaymentModal } from '../../components/EditRefundPaymentModal';
import { CheckoutTenantForm } from './CheckoutTenantForm';
import { Ionicons } from '@expo/vector-icons';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import {
  TenantHeader,
  PendingPaymentAlert,
  AccommodationDetails,
  PersonalInformation,
  ImageViewerModal,
  ReceiptViewModal,
  RentPaymentsSection,
  AdvancePaymentsSection,
  RefundPaymentsSection,
} from './components';
import {
  useCreateAdvancePaymentMutation,
  useCreateRefundPaymentMutation,
  useDeleteAdvancePaymentMutation,
  useDeleteRefundPaymentMutation,
  useUpdateAdvancePaymentMutation,
  useUpdateRefundPaymentMutation,
  useCreateTenantPaymentMutation,
} from '@/services/api/paymentsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import AdvancePaymentForm from './AdvancePaymentForm';
import { useGetAllBedsQuery, useGetAllRoomsQuery } from '@/services/api/roomsApi';
import { useGetPGLocationsQuery } from '@/services/api/pgLocationsApi';
import {
  AdvancePayment,
  PendingPaymentMonth,
  RefundPayment,
  TenantPayment,
  useCheckoutTenantWithDateMutation,
  useDeleteTenantMutation,
  useGetTenantByIdQuery,
  useLazyGetTenantsQuery,
  useTransferTenantMutation,
  useUpdateTenantCheckoutDateMutation,
} from '@/services/api/tenantsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

// Inner component that doesn't directly interact with frozen navigation context
const TenantDetailsContent: React.FC<{
  tenantId: number;
  navigation: any;
  canEditTenant: boolean;
  canDeleteTenant: boolean;
  canCreateRent: boolean;
  canEditRent: boolean;
  canDeleteRent: boolean;
  canCreateAdvance: boolean;
  canEditAdvance: boolean;
  canDeleteAdvance: boolean;
  canCreateRefund: boolean;
  canEditRefund: boolean;
  canDeleteRefund: boolean;
}> = ({
  tenantId,
  navigation,
  canEditTenant,
  canDeleteTenant,
  canCreateRent,
  canEditRent,
  canDeleteRent,
  canCreateAdvance,
  canEditAdvance,
  canDeleteAdvance,
  canCreateRefund,
  canEditRefund,
  canDeleteRefund,
}) => {
  const PAYMENT_METHODS: Option[] = [
    { label: 'GPay', value: 'GPAY', icon: '📱' },
    { label: 'PhonePe', value: 'PHONEPE', icon: '📱' },
    { label: 'Cash', value: 'CASH', icon: '💵' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: '🏦' },
  ];

  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { user } = useSelector((state: RootState) => state.auth);

  const [shouldRefreshTenantsOnBack, setShouldRefreshTenantsOnBack] = useState(false);

  // Checkout date modal state
  const [checkoutDateModalVisible, setCheckoutDateModalVisible] = useState(false);
  const [newCheckoutDate, setNewCheckoutDate] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Transfer tenant modal state
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferPgId, setTransferPgId] = useState<number | null>(null);
  const [transferRoomId, setTransferRoomId] = useState<number | null>(null);
  const [transferBedId, setTransferBedId] = useState<number | null>(null);
  const [transferEffectiveFrom, setTransferEffectiveFrom] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [collectTransferDiffVisible, setCollectTransferDiffVisible] = useState(false);
  const [collectTransferDiffAmount, setCollectTransferDiffAmount] = useState('');
  const [collectTransferDiffPaymentDate, setCollectTransferDiffPaymentDate] = useState('');
  const [collectTransferDiffPaymentMethod, setCollectTransferDiffPaymentMethod] = useState<string | null>(null);
  const [collectTransferDiffRemarks, setCollectTransferDiffRemarks] = useState('');
  const [collectTransferDiffLoading, setCollectTransferDiffLoading] = useState(false);

  const {
    data: tenantResponse,
    isLoading: tenantLoading,
    refetch: refetchTenant,
  } = useGetTenantByIdQuery(tenantId, { skip: !tenantId });

  const [triggerTenants] = useLazyGetTenantsQuery();
  const [deleteTenantMutation] = useDeleteTenantMutation();
  const [checkoutTenantWithDate] = useCheckoutTenantWithDateMutation();
  const [updateTenantCheckoutDate] = useUpdateTenantCheckoutDateMutation();
  const [transferTenantMutation] = useTransferTenantMutation();

  const [createAdvancePayment] = useCreateAdvancePaymentMutation();
  const [updateAdvancePayment] = useUpdateAdvancePaymentMutation();
  const [deleteAdvancePayment] = useDeleteAdvancePaymentMutation();
  const [createRefundPayment] = useCreateRefundPaymentMutation();
  const [updateRefundPayment] = useUpdateRefundPaymentMutation();
  const [deleteRefundPayment] = useDeleteRefundPaymentMutation();

  const [createTenantPayment] = useCreateTenantPaymentMutation();
  
  // Clone tenant data to avoid frozen state issues
  const currentTenant = tenantResponse?.data ? JSON.parse(JSON.stringify(tenantResponse.data)) : null;

  const activeTransferDiffCycle = (currentTenant as any)?.transfer_difference_due_cycle || null;

  const { data: pgLocationsResponse } = useGetPGLocationsQuery(undefined, { skip: false });

  const {
    data: transferRoomsResponse,
    isFetching: transferRoomsLoading,
    error: transferRoomsError,
  } = useGetAllRoomsQuery(
    transferPgId ? ({ pg_id: transferPgId, page: 1, limit: 200 } as any) : (undefined as any),
    { skip: !transferPgId }
  );

  const {
    data: transferBedsResponse,
    isFetching: transferBedsLoading,
    error: transferBedsError,
  } = useGetAllBedsQuery(
    transferRoomId
      ? (({
          room_id: transferRoomId,
          only_unoccupied: true,
          page: 1,
          limit: 500,
        } as any))
      : (undefined as any),
    { skip: !transferRoomId }
  );

  useEffect(() => {
    if (!transferModalVisible) return;
    if (!currentTenant) return;

    setTransferPgId(currentTenant.pg_id ?? selectedPGLocationId ?? null);
    setTransferRoomId(null);
    setTransferBedId(null);
    setTransferEffectiveFrom(currentTenant.check_in_date ? String(currentTenant.check_in_date).split('T')[0] : '');
  }, [transferModalVisible]);

  useEffect(() => {
    if (!transferModalVisible) return;
    if (transferRoomsError) {
      showErrorAlert(transferRoomsError as any, 'Failed to load rooms');
    }
  }, [transferRoomsError, transferModalVisible]);

  useEffect(() => {
    if (!transferModalVisible) return;
    if (transferBedsError) {
      showErrorAlert(transferBedsError as any, 'Failed to load beds');
    }
  }, [transferBedsError, transferModalVisible]);

  const pgItems = ((pgLocationsResponse as any)?.data || (pgLocationsResponse as any) || []).map((pg: any) => ({
    id: Number(pg.s_no),
    label: String(pg.location_name ?? `PG ${pg.s_no}`),
    value: pg.s_no,
  }));

  const roomItems = ((transferRoomsResponse as any)?.data || (transferRoomsResponse as any) || []).map((r: any) => ({
    id: Number(r.s_no),
    label: `Room ${r.room_no}`,
    value: r.s_no,
  }));

  const bedItems = ((transferBedsResponse as any)?.data || (transferBedsResponse as any) || []).map((b: any) => ({
    id: Number(b.s_no),
    label: `Bed ${b.bed_no}`,
    value: b.s_no,
  }));

  const handleOpenTransfer = () => {
    if (!currentTenant) return;
    setTransferModalVisible(true);
  };

  const openCollectTransferDifference = () => {
    if (!currentTenant) return;
    if (!activeTransferDiffCycle) return;

    const remaining = Number(activeTransferDiffCycle.remainingDue || 0);
    setCollectTransferDiffAmount(remaining > 0 ? remaining.toFixed(2) : '');
    setCollectTransferDiffPaymentDate(new Date().toISOString().split('T')[0]);
    setCollectTransferDiffPaymentMethod(null);
    setCollectTransferDiffRemarks(
      `TRANSFER_DIFF ${String(activeTransferDiffCycle.start_date)} to ${String(activeTransferDiffCycle.end_date)}`,
    );
    setCollectTransferDiffVisible(true);
  };

  const handleSubmitCollectTransferDifference = async () => {
    if (!currentTenant) return;
    if (!activeTransferDiffCycle) return;
    if (!canCreateRent) {
      Alert.alert('Access Denied', "You don't have permission to create rent payments");
      return;
    }

    const amount = Number(collectTransferDiffAmount);
    const expected = Number(activeTransferDiffCycle.due || activeTransferDiffCycle.expected_from_allocations || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    if (!collectTransferDiffPaymentDate) {
      Alert.alert('Missing field', 'Please select Payment Date.');
      return;
    }

    if (!collectTransferDiffPaymentMethod) {
      Alert.alert('Missing field', 'Please select Payment Method.');
      return;
    }

    if (!expected || expected <= 0) {
      Alert.alert('Cannot collect', 'Expected amount for this cycle could not be calculated.');
      return;
    }

    if (amount > expected) {
      Alert.alert('Invalid amount', `Amount cannot exceed expected amount (₹${expected}).`);
      return;
    }

    const status = amount >= expected ? 'PAID' : 'PARTIAL';

    try {
      setCollectTransferDiffLoading(true);

      await createTenantPayment({
        tenant_id: currentTenant.s_no,
        pg_id: currentTenant.pg_id,
        room_id: currentTenant.room_id,
        bed_id: currentTenant.bed_id,
        amount_paid: amount,
        actual_rent_amount: expected,
        payment_date: collectTransferDiffPaymentDate,
        payment_method: collectTransferDiffPaymentMethod as any,
        status,
        cycle_id: Number((activeTransferDiffCycle as any).cycle_id),
        remarks: collectTransferDiffRemarks || undefined,
      } as any).unwrap();

      showSuccessAlert('Transfer difference collected');
      setCollectTransferDiffVisible(false);
      setShouldRefreshTenantsOnBack(true);
      refetchTenant();
      refreshTenantList();
    } catch (error: any) {
      showErrorAlert(error, 'Failed to collect transfer difference');
    } finally {
      setCollectTransferDiffLoading(false);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!currentTenant) return;
    if (!transferPgId || !transferRoomId || !transferBedId || !transferEffectiveFrom) {
      Alert.alert('Missing fields', 'Please select PG, Room, Bed and Effective Date.');
      return;
    }

    try {
      setTransferLoading(true);
      await transferTenantMutation({
        id: currentTenant.s_no,
        to_pg_id: transferPgId,
        to_room_id: transferRoomId,
        to_bed_id: transferBedId,
        effective_from: transferEffectiveFrom,
      }).unwrap();
      showSuccessAlert('Tenant transferred successfully');
      setTransferModalVisible(false);
      setShouldRefreshTenantsOnBack(true);
      refetchTenant();
      refreshTenantList();
    } catch (error: any) {
      showErrorAlert(error, 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const [expandedSections, setExpandedSections] = useState({
    rentPayments: false,
    advancePayments: false,
    refundPayments: false,
    transferHistory: false,
  });

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Rent payment form state
  const [rentPaymentFormVisible, setRentPaymentFormVisible] = useState(false);
  
  // Advance payment modal state
  const [advancePaymentModalVisible, setAdvancePaymentModalVisible] = useState(false);
  
  // Refund payment modal state
  const [refundPaymentModalVisible, setRefundPaymentModalVisible] = useState(false);
  
  // Edit advance payment modal state
  const [editAdvancePaymentModalVisible, setEditAdvancePaymentModalVisible] = useState(false);
  const [editingAdvancePayment, setEditingAdvancePayment] = useState<any>(null);

  // Edit refund payment modal state
  const [editRefundPaymentModalVisible, setEditRefundPaymentModalVisible] = useState(false);
  const [editingRefundPayment, setEditingRefundPayment] = useState<any>(null);


  // Receipt modal state
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = React.useRef<View>(null);

  useEffect(() => {
    if (!tenantId) return;
    refetchTenant();
  }, [tenantId, refetchTenant]);

  // Handle refresh parameter when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const route = navigation.getState();
      const currentRoute = route.routes[route.index];
      const shouldRefresh = currentRoute?.params?.refresh;
      
      if (shouldRefresh) {
        console.log('Refresh parameter detected in TenantDetails, reloading data');
        setShouldRefreshTenantsOnBack(true);
        refetchTenant();
        refreshTenantList();
        // Clear the refresh parameter
        navigation.setParams({ refresh: undefined });
      }
    }, [navigation, tenantId, refetchTenant])
  );

  const refreshTenantList = async () => {
    try {
      setShouldRefreshTenantsOnBack(true);
      await triggerTenants({ page: 1, limit: 20 }).unwrap();
    } catch (error) {
      console.error('Error refreshing tenant list:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!shouldRefreshTenantsOnBack) return;

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Ensure Tenants list refreshes after operations (rent/advance/refund/etc)
      navigation.navigate('Tenants', { refresh: true });
    });

    return unsubscribe;
  }, [navigation, shouldRefreshTenantsOnBack]);

  const handleBackPress = () => {
    if (shouldRefreshTenantsOnBack) {
      navigation.navigate('Tenants', { refresh: true });
      return;
    }
    navigation.goBack();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSaveAdvancePayment = async (data: any) => {
    if (!canCreateAdvance) {
      Alert.alert('Access Denied', "You don't have permission to create advance payments");
      throw new Error('ACCESS_DENIED');
    }
    try {
      // Ensure pg_id is available from tenant or selected location
      const pgId = currentTenant?.pg_id || selectedPGLocationId;
      
      if (!pgId) {
        throw new Error('PG Location ID is required');
      }

      await createAdvancePayment({ ...data, pg_id: pgId }).unwrap();

      showSuccessAlert('Advance payment created successfully');
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleSaveRefundPayment = async (data: any) => {
    if (!canCreateRefund) {
      Alert.alert('Access Denied', "You don't have permission to create refund payments");
      throw new Error('ACCESS_DENIED');
    }
    try {
      // Ensure pg_id is available from tenant or selected location
      const pgId = currentTenant?.pg_id || selectedPGLocationId;
      
      if (!pgId) {
        throw new Error('PG Location ID is required');
      }

      await createRefundPayment({ ...data, pg_id: pgId }).unwrap();

      showSuccessAlert('Refund payment created successfully');
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleAddRentPayment = () => {
    if (!canCreateRent) return;
    setRentPaymentFormVisible(true);
  };

  // Receipt handlers
  const prepareReceiptData = (payment: any) => {
    const periodStart = payment?.tenant_rent_cycles?.cycle_start || payment?.start_date;
    const periodEnd = payment?.tenant_rent_cycles?.cycle_end || payment?.end_date;
    return {
      receiptNumber: `RCP-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: payment.payment_date,
      tenantName: currentTenant?.name || '',
      tenantPhone: currentTenant?.phone_no || '',
      pgName: payment.pg_locations?.location_name || currentTenant?.pg_locations?.location_name || '',
      roomNumber: payment.rooms?.room_no || currentTenant?.rooms?.room_no || '',
      bedNumber: payment.beds?.bed_no || currentTenant?.beds?.bed_no || '',
      rentPeriod: {
        startDate: periodStart,
        endDate: periodEnd,
      },
      actualRent: Number(payment.actual_rent_amount || 0),
      amountPaid: Number(payment.amount_paid || 0),
      paymentMethod: payment.payment_method || 'CASH',
      remarks: payment.remarks,
    };
  };

  const prepareAdvanceReceiptData = (payment: any) => {
    return {
      receiptNumber: `ADV-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: payment.payment_date,
      tenantName: currentTenant?.name || '',
      tenantPhone: currentTenant?.phone_no || '',
      pgName: currentTenant?.pg_locations?.location_name || 'PG',
      roomNumber: payment.rooms?.room_no || currentTenant?.rooms?.room_no || '',
      bedNumber: payment.beds?.bed_no || currentTenant?.beds?.bed_no || '',
      rentPeriod: {
        startDate: payment.payment_date,
        endDate: payment.payment_date,
      },
      actualRent: Number(payment.amount_paid || 0),
      amountPaid: Number(payment.amount_paid || 0),
      paymentMethod: payment.payment_method || 'CASH',
      remarks: payment.remarks,
      receiptType: 'ADVANCE' as const,
    };
  };

  const handleViewReceipt = (payment: any) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleWhatsAppReceipt = async (payment: any) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);
      
      // Wait for component to render
      setTimeout(async () => {
        await CompactReceiptGenerator.shareViaWhatsApp(
          receiptRef,
          data,
          currentTenant?.phone_no || ''
        );
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send via WhatsApp');
      setReceiptData(null);
    }
  };

  const handleShareReceipt = async (payment: any) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);
      
      // Wait for component to render
      setTimeout(async () => {
        await CompactReceiptGenerator.shareImage(receiptRef);
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
      setReceiptData(null);
    }
  };

  // Advance payment receipt handlers
  const handleViewAdvanceReceipt = (payment: any) => {
    const data = prepareAdvanceReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleWhatsAppAdvanceReceipt = async (payment: any) => {
    try {
      const data = prepareAdvanceReceiptData(payment);
      setReceiptData(data);
      
      // Wait for component to render
      setTimeout(async () => {
        await CompactReceiptGenerator.shareViaWhatsApp(
          receiptRef,
          data,
          currentTenant?.phone_no || ''
        );
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send via WhatsApp');
      setReceiptData(null);
    }
  };

  const handleShareAdvanceReceipt = async (payment: any) => {
    try {
      const data = prepareAdvanceReceiptData(payment);
      setReceiptData(data);
      
      // Wait for component to render
      setTimeout(async () => {
        await CompactReceiptGenerator.shareImage(receiptRef);
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
      setReceiptData(null);
    }
  };

  const handleEditAdvancePayment = (payment: any) => {
    if (!canEditAdvance) {
      Alert.alert('Access Denied', "You don't have permission to edit advance payments");
      return;
    }
    // Enrich payment with tenant, room, and bed info for display in modal
    const enrichedPayment = {
      ...payment,
      tenants: payment.tenants || { name: currentTenant?.name },
      rooms: payment.rooms || currentTenant?.rooms,
      beds: payment.beds || currentTenant?.beds,
    };
    setEditingAdvancePayment(enrichedPayment);
    setEditAdvancePaymentModalVisible(true);
  };

  const handleUpdateAdvancePayment = async (id: number, data: any) => {
    if (!canEditAdvance) {
      Alert.alert('Access Denied', "You don't have permission to edit advance payments");
      throw new Error('ACCESS_DENIED');
    }
    try {
      await updateAdvancePayment({ id, data }).unwrap();
      setEditAdvancePaymentModalVisible(false);
      setEditingAdvancePayment(null);
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleDeleteAdvancePayment = (payment: any) => {
    if (!canDeleteAdvance) {
      Alert.alert('Access Denied', "You don't have permission to delete advance payments");
      return;
    }
    Alert.alert(
      'Delete Advance Payment',
      `Are you sure you want to delete this payment?\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdvancePayment(payment.s_no).unwrap();
              showSuccessAlert('Advance payment deleted successfully');
              refetchTenant();
              refreshTenantList(); // Refresh tenant list
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  const handleEditRefundPayment = (payment: any) => {
    if (!canEditRefund) {
      Alert.alert('Access Denied', "You don't have permission to edit refund payments");
      return;
    }
    // Enrich payment with tenant, room, and bed info for display in modal
    const enrichedPayment = {
      ...payment,
      tenants: payment.tenants || { name: currentTenant?.name },
      rooms: payment.rooms || currentTenant?.rooms,
      beds: payment.beds || currentTenant?.beds,
    };
    setEditingRefundPayment(enrichedPayment);
    setEditRefundPaymentModalVisible(true);
  };

  const handleUpdateRefundPayment = async (id: number, data: any) => {
    if (!canEditRefund) {
      Alert.alert('Access Denied', "You don't have permission to edit refund payments");
      throw new Error('ACCESS_DENIED');
    }
    try {
      await updateRefundPayment({ id, data }).unwrap();
      setEditRefundPaymentModalVisible(false);
      setEditingRefundPayment(null);
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      throw error; // Re-throw to let modal handle it
    }
  };


  // Checkout handlers
  const handleCheckout = () => {
    setCheckoutDateModalVisible(true);
    setNewCheckoutDate('');
  };

  const confirmCheckout = async () => {
    if (!newCheckoutDate) {
      Alert.alert('Error', 'Please select a checkout date');
      return;
    }

    try {
      setCheckoutLoading(true);
      await checkoutTenantWithDate({ id: currentTenant.s_no, check_out_date: newCheckoutDate }).unwrap();
      showSuccessAlert('Tenant checked out successfully');
      setCheckoutDateModalVisible(false);
      setNewCheckoutDate('');
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      const msg =
        (error as any)?.data?.message ||
        (error as any)?.error?.data?.message ||
        (error as any)?.message ||
        '';

      if (typeof msg === 'string' && msg.toLowerCase().includes('pending dues')) {
        Alert.alert('Cannot Checkout', msg);
      } else {
        showErrorAlert(error, 'Checkout Error');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutDateModalVisible(false);
    setNewCheckoutDate('');
  };

  const handleDeleteRefundPayment = (payment: any) => {
    if (!canDeleteRefund) {
      Alert.alert('Access Denied', "You don't have permission to delete refund payments");
      return;
    }
    Alert.alert(
      'Delete Refund Payment',
      `Are you sure you want to delete this refund?\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRefundPayment(payment.s_no).unwrap();
              showSuccessAlert('Refund payment deleted successfully');
              refetchTenant();
              refreshTenantList(); // Refresh tenant list
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTenant = () => {
    if (!canDeleteTenant) {
      Alert.alert('Access Denied', "You don't have permission to delete tenants");
      return;
    }
    const hasRefundPaid = currentTenant?.is_refund_paid;
    
    if (!hasRefundPaid) {
      // Show warning about unpaid refund
      Alert.alert(
        'Unpaid Refund Warning',
        'This tenant does not have refund paid. Are you sure you still want to delete this tenant?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete Anyway',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTenantMutation(currentTenant?.s_no || 0).unwrap();
                showSuccessAlert('Tenant deleted successfully');
                refreshTenantList(); // Refresh tenant list
                navigation.goBack();
              } catch (error: any) {
                showErrorAlert(error, 'Delete Error');
              }
            },
          },
        ]
      );
    } else {
      // Standard deletion confirmation for tenants with paid refund
      Alert.alert(
        'Delete Tenant',
        `Are you sure you want to delete ${currentTenant?.name || 'this tenant'}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTenantMutation(currentTenant?.s_no || 0).unwrap();
                showSuccessAlert('Tenant deleted successfully');
                refreshTenantList(); // Refresh tenant list
                navigation.goBack();
              } catch (error: any) {
                showErrorAlert(error, 'Delete Error');
              }
            },
          },
        ]
      );
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  };

  const handleChangeCheckoutDate = () => {
    setNewCheckoutDate(currentTenant?.check_out_date ? new Date(currentTenant.check_out_date).toISOString().split('T')[0] : '');
    setCheckoutDateModalVisible(true);
  };

  const handleClearCheckout = () => {
    Alert.alert(
      'Clear Checkout',
      'This will reactivate the tenant and clear the checkout date. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setCheckoutLoading(true);
              await updateTenantCheckoutDate({ id: tenantId, clear_checkout: true }).unwrap();
              showSuccessAlert('Checkout cleared and tenant reactivated successfully');
              refetchTenant();
              refreshTenantList(); // Refresh tenant list
            } catch (error: any) {
              showErrorAlert(error, 'Clear Checkout Error');
            } finally {
              setCheckoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const confirmUpdateCheckoutDate = async () => {
    try {
      setCheckoutLoading(true);
      await updateTenantCheckoutDate({ id: tenantId, check_out_date: newCheckoutDate }).unwrap();
      showSuccessAlert('Checkout date updated successfully');
      setCheckoutDateModalVisible(false);
      refetchTenant();
      refreshTenantList(); // Refresh tenant list
    } catch (error: any) {
      showErrorAlert(error, 'Update Checkout Date Error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (tenantLoading || !currentTenant) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader title="Tenant Details" showBackButton={true} onBackPress={handleBackPress} />
        <View style={{ backgroundColor: CONTENT_COLOR, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <Card style={{ padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonLoader width={56} height={56} borderRadius={28} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SkeletonLoader width={'70%'} height={18} borderRadius={6} />
                  <SkeletonLoader width={'45%'} height={14} borderRadius={6} style={{ marginTop: 10 }} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <SkeletonLoader width={44} height={44} borderRadius={10} style={{ marginRight: 10 }} />
                <SkeletonLoader width={44} height={44} borderRadius={10} style={{ marginRight: 10 }} />
                <SkeletonLoader width={44} height={44} borderRadius={10} style={{ marginRight: 10 }} />
                <SkeletonLoader width={44} height={44} borderRadius={10} />
              </View>
            </Card>

            <Card style={{ padding: 16, marginBottom: 12 }}>
              <SkeletonLoader width={'50%'} height={16} borderRadius={6} />
              <SkeletonLoader width={'85%'} height={14} borderRadius={6} style={{ marginTop: 10 }} />
              <SkeletonLoader width={'75%'} height={14} borderRadius={6} style={{ marginTop: 10 }} />
            </Card>

            <Card style={{ padding: 16, marginBottom: 12 }}>
              <SkeletonLoader width={'60%'} height={16} borderRadius={6} />
              <SkeletonLoader width={'95%'} height={12} borderRadius={6} style={{ marginTop: 12 }} />
              <SkeletonLoader width={'90%'} height={12} borderRadius={6} style={{ marginTop: 10 }} />
              <SkeletonLoader width={'80%'} height={12} borderRadius={6} style={{ marginTop: 10 }} />
            </Card>

            <Card style={{ padding: 16, marginBottom: 12 }}>
              <SkeletonLoader width={'55%'} height={16} borderRadius={6} />
              <SkeletonLoader width={'100%'} height={48} borderRadius={10} style={{ marginTop: 12 }} />
              <SkeletonLoader width={'100%'} height={48} borderRadius={10} style={{ marginTop: 12 }} />
            </Card>
          </ScrollView>
        </View>
      </ScreenLayout>
    );
  }

  const tenant = currentTenant;

  const transferHistory = (tenant?.tenant_allocations || [])
    .slice()
    .sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime());

  const formatDateOnly = (d: any) => {
    if (!d) return '';
    try {
      return String(d).includes('T') ? String(d).split('T')[0] : String(d);
    } catch {
      return String(d);
    }
  };

  const toLocalDateOnly = (dateLike: any): Date | undefined => {
    if (!dateLike) return undefined;
    const dateStr = String(dateLike).includes('T') ? String(dateLike).split('T')[0] : String(dateLike);
    const match = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr);
    if (!match) return undefined;
    const [y, m, d] = dateStr.split('-').map((n) => Number(n));
    return new Date(y, m - 1, d);
  };

  const isCheckoutDayFinished = (() => {
    if (!tenant?.check_out_date) return false;
    const checkoutDate = new Date(tenant.check_out_date);
    if (Number.isNaN(checkoutDate.getTime())) return false;
    checkoutDate.setHours(23, 59, 59, 999);
    return checkoutDate.getTime() < Date.now();
  })();

  const derivedRentStatus = (() => {
    const rentDue = Number((tenant as any)?.rent_due_amount ?? 0);
    const pendingDue = Number((tenant as any)?.pending_due_amount ?? 0);
    const partialDue = Number((tenant as any)?.partial_due_amount ?? 0);
    const pendingMonths = Number((tenant as any)?.pending_months ?? 0);
    const unpaidMonthsCount = Array.isArray((tenant as any)?.unpaid_months) ? (tenant as any).unpaid_months.length : 0;
    const paymentStatus = String((tenant as any)?.payment_status ?? '');

    let label = 'RENT STATUS';
    let color = '#6B7280';
    let bg = '#9CA3AF20';

    if (rentDue <= 0) {
      label = 'RENT PAID';
      color = '#10B981';
      bg = '#10B98120';
    } else if (partialDue > 0) {
      label = pendingDue > 0 ? 'RENT PARTIAL + PENDING' : 'RENT PARTIAL';
      color = '#F97316';
      bg = '#F9731620';
    } else {
      label = paymentStatus === 'NO_PAYMENT' ? 'RENT NOT PAID' : 'RENT PENDING';
      color = '#EF4444';
      bg = '#EF444420';
    }

    return {
      label,
      color,
      bg,
      rentDue,
      pendingDue,
      partialDue,
      pendingMonths,
      unpaidMonthsCount,
    };
  })();

  return (
    <ScreenLayout  backgroundColor={Theme.colors.background.blue} >
      <ScreenHeader 
        title="Tenant Details" 
        showBackButton={true} 
        onBackPress={handleBackPress}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      >
        
      </ScreenHeader>

      <View style={{ flex: 1, backgroundColor : CONTENT_COLOR }}>
        <ScrollView style={{ flex: 1 }}>
        {/* Tenant Header */}
        <TenantHeader
          tenant={tenant}
          showEdit={canEditTenant}
          onEdit={() => {
            if (!canEditTenant) return;
            navigation.navigate('AddTenant', { tenantId: currentTenant.s_no });
          }}
          onDelete={handleDeleteTenant}
          showDelete={canDeleteTenant && !!tenant?.check_out_date}
          disableDelete={!isCheckoutDayFinished}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onEmail={handleEmail}
          onAddPayment={handleAddRentPayment}
          onAddAdvance={() => {
            if (!canCreateAdvance) return;
            setAdvancePaymentModalVisible(true);
          }}
          onAddRefund={() => {
            if (!canCreateRefund) return;
            setRefundPaymentModalVisible(true);
          }}
          canAddPayment={canCreateRent}
          canAddAdvance={canCreateAdvance}
          canAddRefund={canCreateRefund}
        />

        {/* Pending Payment Alert */}
        {tenant.pending_payment && (
          <PendingPaymentAlert pendingPayment={tenant.pending_payment} />
        )}

        {!tenant.pending_payment && (derivedRentStatus.rentDue > 0 || derivedRentStatus.partialDue > 0 || derivedRentStatus.pendingDue > 0) && (
          <Card
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 14,
              backgroundColor: derivedRentStatus.bg,
              borderLeftWidth: 6,
              borderLeftColor: derivedRentStatus.color,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: derivedRentStatus.color, flex: 1 }}>
                {derivedRentStatus.label}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: derivedRentStatus.color }}>
                ₹{derivedRentStatus.rentDue.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={{ marginTop: 10 }}>
              {derivedRentStatus.pendingDue > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Pending</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.text.primary }}>
                    ₹{derivedRentStatus.pendingDue.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              {derivedRentStatus.partialDue > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Partial balance</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.text.primary }}>
                    ₹{derivedRentStatus.partialDue.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              {(derivedRentStatus.pendingMonths > 0 || derivedRentStatus.unpaidMonthsCount > 0) && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Months</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.text.primary }}>
                    {derivedRentStatus.unpaidMonthsCount || derivedRentStatus.pendingMonths}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {activeTransferDiffCycle && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary, flex: 1 }}>
                Transfer Difference Due
              </Text>
              <Ionicons name="swap-horizontal" size={18} color={Theme.colors.primary} />
            </View>

            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 8 }}>
              Cycle: {String(activeTransferDiffCycle.start_date)} - {String(activeTransferDiffCycle.end_date)}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Pending</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>
                ₹{Number(activeTransferDiffCycle.remainingDue || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={openCollectTransferDifference}
              style={{
                backgroundColor: Theme.colors.primary,
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Collect Transfer Difference</Text>
            </TouchableOpacity>
          </Card>
        )}



        {/* Accommodation Details */}
        <AccommodationDetails
          tenant={tenant}
        />

        {/* Personal Information */}
        <PersonalInformation tenant={tenant} onOpenMedia={openImageViewer} />


        {/* Rent Payments Button - Always Show */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TenantRentPaymentsScreen', {
            payments: tenant?.rent_payments || [],
            tenantName: tenant.name,
            tenantId: tenant.s_no,
            tenantPhone: tenant.phone_no,
            pgName: tenant.pg_locations?.location_name || 'PG',
            roomNumber: tenant.rooms?.room_no || '',
            bedNumber: tenant.beds?.bed_no || '',
            roomId: tenant.room_id || 0,
            bedId: tenant.bed_id || 0,
            pgId: tenant.pg_id || selectedPGLocationId || 0,
            joiningDate: tenant.check_in_date,
          })}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: Theme.colors.background.secondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Theme.colors.border,
            opacity: tenant?.rent_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: Theme.colors.background.blueLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="receipt-outline" size={18} color={Theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Rent Payments
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.tertiary }}>
                  {tenant?.rent_payments?.length || 0} records
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Advance Payments Button - Always Show */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TenantAdvancePaymentsScreen', {
            payments: tenant?.advance_payments || [],
            tenantName: tenant.name,
            tenantId: tenant.s_no,
            pgId: tenant.pg_id || selectedPGLocationId || 0,
            tenantJoinedDate: tenant.check_in_date,
            tenantPhone: tenant.phone_no,
            pgName: tenant.pg_locations?.location_name || 'PG',
            roomNumber: tenant.rooms?.room_no || '',
            bedNumber: tenant.beds?.bed_no || '',
          })}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: Theme.colors.background.secondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Theme.colors.border,
            opacity: tenant?.advance_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Advance Payments
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.tertiary }}>
                  {tenant?.advance_payments?.length || 0} records
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Refund Payments Button - Always Show */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TenantRefundPaymentsScreen', {
            payments: tenant?.refund_payments || [],
            tenantName: tenant.name,
            tenantId: tenant.s_no,
            tenantPhone: tenant.phone_no,
            pgName: tenant.pg_locations?.location_name || 'PG',
            roomNumber: tenant.rooms?.room_no || '',
            bedNumber: tenant.beds?.bed_no || '',
            roomId: tenant.room_id || 0,
            bedId: tenant.bed_id || 0,
            pgId: tenant.pg_id || selectedPGLocationId || 0,
          })}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: Theme.colors.background.secondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Theme.colors.border,
            opacity: tenant?.refund_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#FFFBEB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="arrow-undo-outline" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Refund Payments
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.tertiary }}>
                  {tenant?.refund_payments?.length || 0} records
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {transferHistory.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  transferHistory: !prev.transferHistory,
                }))
              }
              style={{
                marginHorizontal: 16,
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: Theme.colors.background.secondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: '#EEF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color={Theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                      Transfer History
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.tertiary }}>
                      {transferHistory.length} records
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={expandedSections.transferHistory ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Theme.colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>

            {expandedSections.transferHistory && (
              <View style={{ marginTop: 10 }}>
                {transferHistory.map((a: any, idx: number) => {
                  const isCurrent = !a.effective_to;
                  const from = formatDateOnly(a.effective_from);
                  const to = a.effective_to ? formatDateOnly(a.effective_to) : 'Present';
                  const isLast = idx === transferHistory.length - 1;

                  const pgName = a.pg_locations?.location_name || `PG ${a.pg_id}`;
                  const roomNo = a.rooms?.room_no || a.room_id;
                  const bedNo = a.beds?.bed_no || a.bed_id;

                  return (
                    <View key={a.s_no || idx} style={{ marginHorizontal: 16, marginBottom: 10, flexDirection: 'row' }}>
                      <View style={{ width: 18, alignItems: 'center' }}>
                        
                        {!isLast && (
                          <View
                            style={{
                              width: 2,
                              flex: 1,
                              backgroundColor: Theme.colors.border,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </View>

                      <Card
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: Theme.colors.border,
                          backgroundColor: Theme.colors.background.secondary,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary }}>
                            {from} - {to}
                          </Text>
                          {isCurrent && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 999,
                                backgroundColor: '#10B98120',
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>CURRENT</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ marginTop: 8, gap: 4 }}>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: 72, fontSize: 11, color: Theme.colors.text.tertiary }}>PG</Text>
                            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary }}>
                              {pgName}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: 72, fontSize: 11, color: Theme.colors.text.tertiary }}>Room / Bed</Text>
                            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary }}>
                              Room {roomNo}  •  Bed {bedNo}
                            </Text>
                          </View>
                          {a.bed_price_snapshot != null && (
                            <View style={{ flexDirection: 'row' }}>
                              <Text style={{ width: 72, fontSize: 11, color: Theme.colors.text.tertiary }}>Price</Text>
                              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: Theme.colors.text.secondary }}>
                                ₹{Number(a.bed_price_snapshot || 0).toLocaleString('en-IN')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Card>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        
        {/* Checkout Actions - Only show if there's a checkout date */}
        {(() => {
          const isCheckedOut = !!currentTenant?.check_out_date;
          const isActive = currentTenant?.status === 'ACTIVE';
          const hasEditPermission = !!canEditTenant;

          const resolveDisabledReason = (action: 'CHECKOUT' | 'CHANGE_CHECKOUT' | 'CLEAR_CHECKOUT' | 'TRANSFER') => {
            if (!hasEditPermission) return "No permission";
            if (checkoutLoading) return "Please wait";

            if (action === 'CHECKOUT') {
              if (!isActive) return 'Tenant is not active';
              if (isCheckedOut) return 'Already checked out';
              return '';
            }

            if (action === 'CHANGE_CHECKOUT' || action === 'CLEAR_CHECKOUT') {
              if (!isCheckedOut) return 'Tenant not checked out yet';
              return '';
            }

            if (action === 'TRANSFER') {
              if (!isActive) return 'Tenant is not active';
              if (isCheckedOut) return 'Tenant is checked out';
              return '';
            }

            return '';
          };

          const checkoutReason = resolveDisabledReason('CHECKOUT');
          const changeReason = resolveDisabledReason('CHANGE_CHECKOUT');
          const clearReason = resolveDisabledReason('CLEAR_CHECKOUT');
          const transferReason = resolveDisabledReason('TRANSFER');

          return (
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <ActionTile
                  title="Checkout"
                  icon="log-out-outline"
                  onPress={handleCheckout}
                  disabledReason={checkoutReason}
                  loading={checkoutLoading}
                />
                <ActionTile
                  title="Transfer"
                  icon="swap-horizontal-outline"
                  onPress={handleOpenTransfer}
                  disabledReason={transferReason}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionTile
                  title="Change Checkout"
                  icon="calendar-outline"
                  onPress={handleChangeCheckoutDate}
                  disabledReason={changeReason}
                />
                <ActionTile
                  title="Clear Checkout"
                  icon="refresh-outline"
                  onPress={handleClearCheckout}
                  disabledReason={clearReason}
                />
              </View>
            </View>
          );
        })()}

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        imageUri={selectedImage}
        onClose={closeImageViewer}
      />

      {/* Checkout Modal */}
      {tenant && (
        <SlideBottomModal
          visible={checkoutDateModalVisible}
          title="Checkout Tenant"
          subtitle={`Mark ${tenant?.name || ''} as checked out from the selected date.`}
          isLoading={checkoutLoading}
          submitLabel="Confirm Checkout"
          cancelLabel="Cancel"
          onClose={handleCloseCheckoutModal}
          onSubmit={confirmUpdateCheckoutDate}
        >
          <View style={{
            marginBottom: 10,
            padding: 10,
            backgroundColor: Theme.colors.background.blueLight,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Theme.colors.border,
          }}>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
              Checkout stops the tenant from being treated as ACTIVE after that date.
              Choose the last day the tenant stayed in this PG.
            </Text>
          </View>
          <CheckoutTenantForm
            tenant={tenant}
            checkoutDate={newCheckoutDate}
            onDateChange={setNewCheckoutDate}
          />
        </SlideBottomModal>
      )}

      {tenant && (
        <SlideBottomModal
          visible={transferModalVisible}
          title="Transfer Tenant"
          subtitle={`Move ${tenant?.name || ''} to a different bed from an effective date.`}
          isLoading={transferLoading}
          submitLabel="Confirm Transfer"
          cancelLabel="Cancel"
          onClose={() => setTransferModalVisible(false)}
          onSubmit={handleSubmitTransfer}
        >
          <View style={{
            marginBottom: 10,
            padding: 10,
            backgroundColor: Theme.colors.background.blueLight,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Theme.colors.border,
          }}>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
              Effective From is the first day the tenant will stay in the new bed.
              Transfer is allowed only once per rent cycle.
            </Text>
          </View>
          <SearchableDropdown
            label="PG Location"
            placeholder="Select PG"
            items={pgItems}
            selectedValue={transferPgId}
            onSelect={(item) => {
              const nextPg = item.id || null;
              setTransferPgId(nextPg);
              setTransferRoomId(null);
              setTransferBedId(null);
            }}
            loading={false}
            disabled={false}
            required={true}
          />

          <SearchableDropdown
            label="Room"
            placeholder="Select room"
            items={roomItems}
            selectedValue={transferRoomId}
            onSelect={(item) => {
              const nextRoom = item.id || null;
              setTransferRoomId(nextRoom);
              setTransferBedId(null);
            }}
            loading={transferRoomsLoading}
            disabled={!transferPgId}
            required={true}
          />

          <SearchableDropdown
            label="Bed"
            placeholder="Select bed"
            items={bedItems}
            selectedValue={transferBedId}
            onSelect={(item) => setTransferBedId(item.id || null)}
            loading={transferBedsLoading}
            disabled={!transferRoomId}
            required={true}
          />

          <DatePicker
            label="Effective From"
            value={transferEffectiveFrom}
            onChange={setTransferEffectiveFrom}
            required={true}
            minimumDate={toLocalDateOnly(tenant?.check_in_date)}
          />
        </SlideBottomModal>
      )}

      {/* Rent Payment Form (Add/Edit) */}
      {tenant && (
        <RentPaymentForm
          visible={rentPaymentFormVisible}
          tenantId={tenant.s_no}
          tenantName={tenant.name}
          roomId={tenant.room_id || 0}
          bedId={tenant.bed_id || 0}
          pgId={tenant.pg_id || selectedPGLocationId || 0}
          rentAmount={tenant.rooms?.rent_price || 0}
          joiningDate={tenant.check_in_date}
          lastPaymentStartDate={
            tenant.rent_payments && tenant.rent_payments.length > 0
              ? ((tenant.rent_payments[0] as any).tenant_rent_cycles?.cycle_start || (tenant.rent_payments[0] as any).start_date)
              : undefined
          }
          lastPaymentEndDate={
            tenant.rent_payments && tenant.rent_payments.length > 0
              ? ((tenant.rent_payments[0] as any).tenant_rent_cycles?.cycle_end || (tenant.rent_payments[0] as any).end_date)
              : undefined
          }
          previousPayments={
            (tenant.rent_payments
              ?.sort((a: TenantPayment, b: TenantPayment) => {
                const bEnd = (b as any)?.tenant_rent_cycles?.cycle_end || (b as any)?.end_date || (b as any)?.payment_date || '';
                const aEnd = (a as any)?.tenant_rent_cycles?.cycle_end || (a as any)?.end_date || (a as any)?.payment_date || '';
                return new Date(bEnd).getTime() - new Date(aEnd).getTime();
              }) as any[]) || []
          }
          onClose={() => {
            setRentPaymentFormVisible(false);
          }}
          onSuccess={() => {
            refetchTenant();
            refreshTenantList();
          }}
        />
      )}

      {tenant && (
        <SlideBottomModal
          visible={collectTransferDiffVisible}
          title="Collect Transfer Difference"
          subtitle={tenant?.name ? `Tenant: ${tenant.name}` : 'Tenant'}
          isLoading={collectTransferDiffLoading}
          submitLabel="Collect"
          cancelLabel="Cancel"
          onClose={() => setCollectTransferDiffVisible(false)}
          onSubmit={handleSubmitCollectTransferDifference}
        >
          <AmountInput
            label="Amount"
            value={collectTransferDiffAmount}
            onChangeText={setCollectTransferDiffAmount}
            required
            containerStyle={{ marginBottom: 16 }}
          />

          <View style={{ marginBottom: 16 }}>
            <DatePicker
              label="Payment Date"
              value={collectTransferDiffPaymentDate}
              onChange={setCollectTransferDiffPaymentDate}
              required
            />
          </View>

          <OptionSelector
            label="Payment Method"
            options={PAYMENT_METHODS}
            selectedValue={collectTransferDiffPaymentMethod}
            onSelect={(value) => setCollectTransferDiffPaymentMethod(value)}
            required
            containerStyle={{ marginBottom: 16 }}
          />

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
              Remarks (Optional)
            </Text>
            <TextInput
              value={collectTransferDiffRemarks}
              onChangeText={setCollectTransferDiffRemarks}
              placeholder="e.g. Transfer difference collection"
              placeholderTextColor={Theme.colors.input.placeholder}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: Theme.colors.input.background,
                borderWidth: 1,
                borderColor: Theme.colors.input.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
                color: Theme.colors.text.primary,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </SlideBottomModal>
      )}

      {/* Advance Payment Form (Add/Edit) */}
      {tenant && (
        <AdvancePaymentForm
          visible={advancePaymentModalVisible || editAdvancePaymentModalVisible}
          mode={editAdvancePaymentModalVisible ? "edit" : "add"}
          tenantId={tenant.s_no}
          tenantName={tenant.name}
          tenantJoinedDate={tenant.check_in_date}
          pgId={tenant.pg_id || selectedPGLocationId || 0}
          roomId={tenant.room_id || 0}
          bedId={tenant.bed_id || 0}
          paymentId={editingAdvancePayment?.s_no}
          existingPayment={editingAdvancePayment}
          onClose={() => {
            setAdvancePaymentModalVisible(false);
            setEditAdvancePaymentModalVisible(false);
            setEditingAdvancePayment(null);
          }}
          onSuccess={() => {
            refetchTenant();
            refreshTenantList();
          }}
          onSave={handleUpdateAdvancePayment}
        />
      )}

      {/* Add Refund Payment Modal */}
      {tenant && (
        <AddRefundPaymentModal
          visible={refundPaymentModalVisible}
          tenant={tenant}
          onClose={() => setRefundPaymentModalVisible(false)}
          onSave={handleSaveRefundPayment}
        />
      )}

      {/* Edit Refund Payment Modal */}
      {tenant && (
        <EditRefundPaymentModal
          visible={editRefundPaymentModalVisible}
          payment={editingRefundPayment}
          onClose={() => {
            setEditRefundPaymentModalVisible(false);
            setEditingRefundPayment(null);
          }}
          onSave={handleUpdateRefundPayment}
        />
      )}


      {/* Receipt View Modal */}
      <ReceiptViewModal
        visible={receiptModalVisible}
        receiptData={receiptData}
        receiptRef={receiptRef}
        onClose={() => setReceiptModalVisible(false)}
      />

      {/* Hidden receipt for capture (off-screen) */}
      {receiptData && !receiptModalVisible && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <View ref={receiptRef} collapsable={false}>
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          </View>
        </View>
      )}
      </View>
    </ScreenLayout>
  );
};

// Wrapper component - extract navigation context and pass as props
function TenantDetailsScreenWrapper() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { tenantId } = route.params;
  const { can } = usePermissions();
  const canEditTenant = can(Permission.EDIT_TENANT);
  const canDeleteTenant = can(Permission.DELETE_TENANT);

  const canCreateRent = can(Permission.CREATE_RENT);
  const canEditRent = can(Permission.EDIT_RENT);
  const canDeleteRent = can(Permission.DELETE_RENT);

  const canCreateAdvance = can(Permission.CREATE_ADVANCE);
  const canEditAdvance = can(Permission.EDIT_ADVANCE);
  const canDeleteAdvance = can(Permission.DELETE_ADVANCE);

  const canCreateRefund = can(Permission.CREATE_REFUND);
  const canEditRefund = can(Permission.EDIT_REFUND);
  const canDeleteRefund = can(Permission.DELETE_REFUND);
  
  return (
    <TenantDetailsContent 
      tenantId={tenantId} 
      navigation={navigation} 
      canEditTenant={canEditTenant}
      canDeleteTenant={canDeleteTenant}
      canCreateRent={canCreateRent}
      canEditRent={canEditRent}
      canDeleteRent={canDeleteRent}
      canCreateAdvance={canCreateAdvance}
      canEditAdvance={canEditAdvance}
      canDeleteAdvance={canDeleteAdvance}
      canCreateRefund={canCreateRefund}
      canEditRefund={canEditRefund}
      canDeleteRefund={canDeleteRefund}
    />
  );
}

export const TenantDetailsScreen = TenantDetailsScreenWrapper;
