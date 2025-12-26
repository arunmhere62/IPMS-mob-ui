import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { DatePicker } from '../../components/DatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { CONTENT_COLOR } from '@/constant';
import RentPaymentForm from './RentPaymentForm';
import { AddRefundPaymentModal } from './AddRefundPaymentModal';
import { EditRefundPaymentModal } from '../../components/EditRefundPaymentModal';
import { CheckoutTenantForm } from './CheckoutTenantForm';
import { Ionicons } from '@expo/vector-icons';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
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
  useUpdateTenantPaymentMutation,
  useUpdateAdvancePaymentMutation,
  useUpdateRefundPaymentMutation,
  useDeleteTenantPaymentMutation,
} from '@/services/api/paymentsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import AdvancePaymentForm from './AdvancePaymentForm';
import {
  AdvancePayment,
  PendingPaymentMonth,
  RefundPayment,
  TenantPayment,
  useCheckoutTenantWithDateMutation,
  useDeleteTenantMutation,
  useGetTenantByIdQuery,
  useLazyGetTenantsQuery,
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
}> = ({ tenantId, navigation, canEditTenant, canDeleteTenant }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: tenantResponse,
    isLoading: tenantLoading,
    refetch: refetchTenant,
  } = useGetTenantByIdQuery(tenantId, { skip: !tenantId });

  const [triggerTenants] = useLazyGetTenantsQuery();
  const [deleteTenantMutation] = useDeleteTenantMutation();
  const [deleteTenantPayment] = useDeleteTenantPaymentMutation();
  const [checkoutTenantWithDate] = useCheckoutTenantWithDateMutation();
  const [updateTenantCheckoutDate] = useUpdateTenantCheckoutDateMutation();

  const [createAdvancePayment] = useCreateAdvancePaymentMutation();
  const [updateAdvancePayment] = useUpdateAdvancePaymentMutation();
  const [deleteAdvancePayment] = useDeleteAdvancePaymentMutation();
  const [createRefundPayment] = useCreateRefundPaymentMutation();
  const [updateRefundPayment] = useUpdateRefundPaymentMutation();
  const [deleteRefundPayment] = useDeleteRefundPaymentMutation();
  const [updateTenantPayment] = useUpdateTenantPaymentMutation();
  
  // Clone tenant data to avoid frozen state issues
  const currentTenant = tenantResponse?.data ? JSON.parse(JSON.stringify(tenantResponse.data)) : null;

  const [expandedSections, setExpandedSections] = useState({
    rentPayments: false,
    advancePayments: false,
    refundPayments: false,
    pendingMonths: false,
    proofDocuments: false,
    images: false,
  });

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Checkout date modal state
  const [checkoutDateModalVisible, setCheckoutDateModalVisible] = useState(false);
  const [newCheckoutDate, setNewCheckoutDate] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Rent payment form state (unified for add and edit)
  const [rentPaymentFormVisible, setRentPaymentFormVisible] = useState(false);
  const [rentPaymentFormMode, setRentPaymentFormMode] = useState<"add" | "edit">("add");
  const [editingRentPayment, setEditingRentPayment] = useState<any>(null);
  
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
        refetchTenant();
        refreshTenantList();
        // Clear the refresh parameter
        navigation.setParams({ refresh: undefined });
      }
    }, [navigation, tenantId, refetchTenant])
  );

  const refreshTenantList = async () => {
    try {
      await triggerTenants({ page: 1, limit: 20 }).unwrap();
    } catch (error) {
      console.error('Error refreshing tenant list:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSaveAdvancePayment = async (data: any) => {
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
    setRentPaymentFormMode("add");
    setEditingRentPayment(null);
    setRentPaymentFormVisible(true);
  };

  const handleEditRentPayment = (payment: any) => {
    setRentPaymentFormMode("edit");
    setEditingRentPayment(payment);
    setRentPaymentFormVisible(true);
  };

  const handleSaveRentPayment = async (id: number, data: any) => {
    try {
      await updateTenantPayment({ id, data }).unwrap();
      setRentPaymentFormVisible(false);
      setEditingRentPayment(null);
      refetchTenant();
      refreshTenantList();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteRentPayment = (payment: any) => {
    Alert.alert(
      'Delete Rent Payment',
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
              await deleteTenantPayment(payment.s_no).unwrap();
              showSuccessAlert('Rent payment deleted successfully');
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

  // Receipt handlers
  const prepareReceiptData = (payment: any) => {
    return {
      receiptNumber: `RCP-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: payment.payment_date,
      tenantName: currentTenant?.name || '',
      tenantPhone: currentTenant?.phone_no || '',
      pgName: currentTenant?.pg_locations?.location_name || 'PG',
      roomNumber: payment.rooms?.room_no || currentTenant?.rooms?.room_no || '',
      bedNumber: payment.beds?.bed_no || currentTenant?.beds?.bed_no || '',
      rentPeriod: {
        startDate: payment.start_date,
        endDate: payment.end_date,
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
      showErrorAlert(error, 'Checkout Error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutDateModalVisible(false);
    setNewCheckoutDate('');
  };

  const handleDeleteRefundPayment = (payment: any) => {
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
        <ScreenHeader title="Tenant Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={{backgroundColor : CONTENT_COLOR, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
            Loading tenant details...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const tenant = currentTenant;

  return (
    <ScreenLayout  backgroundColor={Theme.colors.background.blue} >
      <ScreenHeader 
        title="Tenant Details" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
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
            if (!canEditTenant) {
              Alert.alert('Access Denied', "You don't have permission to edit tenants");
              return;
            }
            navigation.navigate('AddTenant', { tenantId: currentTenant.s_no });
          }}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onEmail={handleEmail}
          onAddPayment={handleAddRentPayment}
          onAddAdvance={() => setAdvancePaymentModalVisible(true)}
          onAddRefund={() => setRefundPaymentModalVisible(true)}
        />

        {/* Pending Payment Alert */}
        {tenant.pending_payment && (
          <PendingPaymentAlert pendingPayment={tenant.pending_payment} />
        )}

        {/* Accommodation Details */}
        <AccommodationDetails
          tenant={tenant}
        />

        {/* Personal Information */}
        <PersonalInformation tenant={tenant} />


        {/* Rent Payments Button - Always Show */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TenantRentPaymentsScreen', {
            payments: tenant?.tenant_payments || [],
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
            paddingHorizontal: 16,
            backgroundColor: '#DBEAFE',
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: Theme.colors.primary,
            opacity: tenant?.tenant_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
              📋 Rent Payments ({tenant?.tenant_payments?.length || 0})
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.primary} />
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
            paddingHorizontal: 16,
            backgroundColor: '#F0FDF4',
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#10B981',
            opacity: tenant?.advance_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
              💰 Advance Payments ({tenant?.advance_payments?.length || 0})
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#10B981" />
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
            paddingHorizontal: 16,
            backgroundColor: '#FEF3C7',
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#F59E0B',
            opacity: tenant?.refund_payments?.length > 0 ? 1 : 0.7,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#D97706' }}>
              🔄 Refund Payments ({tenant?.refund_payments?.length || 0})
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#D97706" />
          </View>
        </TouchableOpacity>

        {/* Proof Documents */}
        <CollapsibleSection
          title="Proof Documents"
          icon="document-outline"
          itemCount={tenant.proof_documents && Array.isArray(tenant.proof_documents) ? tenant.proof_documents.length : 0}
          expanded={expandedSections.proofDocuments}
          onToggle={() => toggleSection('proofDocuments')}
          theme="lightBlue"
        >
          {tenant.proof_documents && Array.isArray(tenant.proof_documents) && tenant.proof_documents.length > 0 ? (
            <View style={{ padding: 16, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {tenant.proof_documents.map((doc: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageViewer(doc)}
                    style={{
                      width: '48%',
                      aspectRatio: 1,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Image
                      source={{ uri: doc }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#fff',
                          textAlign: 'center',
                          fontWeight: '600',
                        }}
                      >
                        Document {index + 1}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary }}>
                No proof documents uploaded
              </Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Tenant Images */}
        <CollapsibleSection
          title="Tenant Images"
          icon="image-outline"
          itemCount={tenant.images && Array.isArray(tenant.images) ? tenant.images.length : 0}
          expanded={expandedSections.images}
          onToggle={() => toggleSection('images')}
          theme="lightBlue"
        >
          {tenant.images && Array.isArray(tenant.images) && tenant.images.length > 0 ? (
            <View style={{ padding: 16, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {tenant.images.map((image: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageViewer(image)}
                    style={{
                      width: '48%',
                      aspectRatio: 1,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: image }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary }}>
                No images uploaded
              </Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Checkout Actions - Only show if there's a checkout date */}
        {currentTenant?.check_out_date ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={handleChangeCheckoutDate}
                disabled={checkoutLoading}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: checkoutLoading ? '#E5E7EB' : '#6366F1',
                  borderRadius: 8,
                  alignItems: 'center',
                  minHeight: 44,
                }}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#6B7280" size="small" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Change Checkout Date</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearCheckout}
                disabled={checkoutLoading}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: checkoutLoading ? '#E5E7EB' : '#10B981',
                  borderRadius: 8,
                  alignItems: 'center',
                  minHeight: 44,
                }}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#6B7280" size="small" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Clear Checkout</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleDeleteTenant}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#EF4444',
                borderRadius: 8,
                alignItems: 'center',
                minHeight: 44,
                opacity: canDeleteTenant ? 1 : 0.45,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Delete Tenant</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={checkoutLoading}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: checkoutLoading ? '#E5E7EB' : '#F59E0B',
                borderRadius: 8,
                alignItems: 'center',
                minHeight: 44,
              }}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#6B7280" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="log-out-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Checkout</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

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
          subtitle={`Update checkout date for ${tenant?.name || ''}`}
          isLoading={checkoutLoading}
          submitLabel="Confirm Checkout"
          cancelLabel="Cancel"
          onClose={handleCloseCheckoutModal}
          onSubmit={confirmUpdateCheckoutDate}
        >
          <CheckoutTenantForm
            tenant={tenant}
            checkoutDate={newCheckoutDate}
            onDateChange={setNewCheckoutDate}
          />
        </SlideBottomModal>
      )}

      {/* Rent Payment Form (Add/Edit) */}
      {tenant && (
        <RentPaymentForm
          visible={rentPaymentFormVisible}
          mode={rentPaymentFormMode}
          tenantId={tenant.s_no}
          tenantName={tenant.name}
          roomId={tenant.room_id || 0}
          bedId={tenant.bed_id || 0}
          pgId={tenant.pg_id || selectedPGLocationId || 0}
          rentAmount={tenant.rooms?.rent_price || 0}
          joiningDate={tenant.check_in_date}
          lastPaymentStartDate={
            tenant.tenant_payments && tenant.tenant_payments.length > 0
              ? tenant.tenant_payments[0].start_date
              : undefined
          }
          lastPaymentEndDate={
            tenant.tenant_payments && tenant.tenant_payments.length > 0
              ? tenant.tenant_payments[0].end_date
              : undefined
          }
          previousPayments={
            (tenant.tenant_payments
              ?.filter((p: TenantPayment) => p.s_no !== editingRentPayment?.s_no)
              ?.sort((a: TenantPayment, b: TenantPayment) => {
                return new Date(b.payment_date || b.end_date || '').getTime() - new Date(a.payment_date || a.end_date || '').getTime();
              }) as any[]) || []
          }
          paymentId={editingRentPayment?.s_no}
          existingPayment={rentPaymentFormMode === "edit" ? editingRentPayment : undefined}
          onClose={() => {
            setRentPaymentFormVisible(false);
            setEditingRentPayment(null);
          }}
          onSuccess={() => {
            refetchTenant();
            refreshTenantList();
          }}
          onSave={handleSaveRentPayment}
        />
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
  
  return (
    <TenantDetailsContent 
      tenantId={tenantId} 
      navigation={navigation} 
      canEditTenant={canEditTenant}
      canDeleteTenant={canDeleteTenant}
    />
  );
}

export const TenantDetailsScreen = TenantDetailsScreenWrapper;
