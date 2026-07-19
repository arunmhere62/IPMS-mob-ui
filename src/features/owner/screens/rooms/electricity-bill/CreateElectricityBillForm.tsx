import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, Alert, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import {
  useCreateElectricityBillMutation,
  useLazyGetEligibleTenantsForPeriodQuery,
  type AllocationBasis,
  type CustomAllocationItem,
  type CreateElectricityBillDto,
  type EligibleTenant } from '@/features/owner/api';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { DatePicker } from '@/components/DatePicker';
import { OptionSelector } from '@/components/OptionSelector';
import { Card } from '@/components/Card';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface CreateElectricityBillFormProps {
  visible: boolean;
  roomId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const sanitizeNumeric = (text: string): string => {
  return text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
};

const allocationOptions = [
  { label: 'Equal', value: 'EQUAL' },
  { label: 'Rent Cycle Days', value: 'RENT_CYCLE_DAYS' },
  { label: 'Custom', value: 'CUSTOM' },
];

const monthOptions = [
  { label: 'Jan', value: '0' },
  { label: 'Feb', value: '1' },
  { label: 'Mar', value: '2' },
  { label: 'Apr', value: '3' },
  { label: 'May', value: '4' },
  { label: 'Jun', value: '5' },
  { label: 'Jul', value: '6' },
  { label: 'Aug', value: '7' },
  { label: 'Sep', value: '8' },
  { label: 'Oct', value: '9' },
  { label: 'Nov', value: '10' },
  { label: 'Dec', value: '11' },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const year = currentYear - 2 + i;
  return { label: String(year), value: String(year) };
});

export const CreateElectricityBillForm: React.FC<CreateElectricityBillFormProps> = ({
  visible,
  roomId,
  onClose,
  onSuccess }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [prevReading, setPrevReading] = useState('');
  const [currReading, setCurrReading] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allocationBasis, setAllocationBasis] = useState<AllocationBasis | null>(null);
  const [customAllocations, setCustomAllocations] = useState<Record<number, string>>({});
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const [eligibleTenants, setEligibleTenants] = useState<EligibleTenant[]>([]);
  const [fetchingTenants, setFetchingTenants] = useState(false);

  const [createBill, { isLoading }] = useCreateElectricityBillMutation();
  const [getEligibleTenants] = useLazyGetEligibleTenantsForPeriodQuery();

  const isMountedRef = useRef(true);
  const submittingRef = useRef(false);
  // Refs for chaining meter reading inputs
  const prevReadingRef = useRef<TextInput>(null);
  const currReadingRef = useRef<TextInput>(null);
  const ratePerUnitRef = useRef<TextInput>(null);

  const { periodStart, periodEnd } = useMemo(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth);
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      periodStart: formatDate(start),
      periodEnd: formatDate(end) };
  }, [selectedMonth, selectedYear]);

  // Fetch eligible tenants when period changes
  useEffect(() => {
    isMountedRef.current = true;
    if (selectedPGLocationId && roomId && periodStart && periodEnd) {
      setFetchingTenants(true);
      getEligibleTenants({
        room_id: roomId,
        bill_period_start: periodStart,
        bill_period_end: periodEnd }).unwrap().then((response) => {
        if (isMountedRef.current && response.success) {
          setEligibleTenants(response.data);
        }
      }).catch(() => {
        if (isMountedRef.current) {
          setEligibleTenants([]);
        }
      }).finally(() => {
        if (isMountedRef.current) {
          setFetchingTenants(false);
        }
      });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [selectedPGLocationId, roomId, periodStart, periodEnd, getEligibleTenants]);

  useEffect(() => {
    const prev = Number(prevReading || 0);
    const curr = Number(currReading || 0);
    const rate = Number(ratePerUnit || 0);
    if (curr > prev && rate > 0) {
      const units = curr - prev;
      setTotalAmount(String((units * rate).toFixed(2)));
    }
  }, [prevReading, currReading, ratePerUnit]);

  useEffect(() => {
    if (allocationBasis === 'CUSTOM') {
      const perTenant = eligibleTenants.length > 0 ? (Number(totalAmount || 0) / eligibleTenants.length).toFixed(2) : '0';
      const initial: Record<number, string> = {};
      eligibleTenants.forEach((t) => {
        initial[t.tenant_id] = perTenant;
      });
      setCustomAllocations(initial);
    }
  }, [allocationBasis, eligibleTenants, totalAmount]);

  const reset = () => {
    setSelectedMonth(String(today.getMonth()));
    setSelectedYear(String(today.getFullYear()));
    setPrevReading('');
    setCurrReading('');
    setRatePerUnit('');
    setTotalAmount('');
    setDueDate('');
    setAllocationBasis(null);
    setCustomAllocations({});
    setEligibleTenants([]);
    setFetchingTenants(false);
    submittingRef.current = false;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = () => {
    if (!selectedPGLocationId) return 'PG location is required. Please select a PG location first.';
    if (!selectedMonth || !selectedYear) return 'Billing month and year are required';
    const amount = Number(totalAmount || 0);
    if (!totalAmount || amount <= 0) return 'Total amount is required and must be greater than 0';
    if (eligibleTenants.length === 0) return 'No tenants were active in this room during the selected period';
    if (!allocationBasis) return 'Please select a split method';
    if (allocationBasis === 'CUSTOM') {
      const total = Object.values(customAllocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (Math.abs(total - amount) > 0.01) {
        return `Custom allocations total (₹${total.toFixed(2)}) must equal bill total (₹${amount.toFixed(2)})`;
      }
      const missingTenant = eligibleTenants.find((t) => !customAllocations[t.tenant_id] || Number(customAllocations[t.tenant_id]) <= 0);
      if (missingTenant) {
        return `Please enter a valid share amount for ${missingTenant.name}`;
      }
    }
    if (prevReading && currReading && Number(currReading) <= Number(prevReading)) {
      return 'Current meter reading must be greater than previous reading';
    }
    return null;
  };

  const handleSave = async () => {
    if (submittingRef.current || isLoading) return;
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    submittingRef.current = true;

    const payload: CreateElectricityBillDto = {
      pg_id: selectedPGLocationId!,
      room_id: roomId,
      bill_period_start: periodStart,
      bill_period_end: periodEnd,
      total_amount: Number(totalAmount),
      units_consumed: currReading && prevReading ? Number(currReading) - Number(prevReading) : undefined,
      rate_per_unit: ratePerUnit ? Number(ratePerUnit) : undefined,
      meter_reading_start: prevReading ? Number(prevReading) : undefined,
      meter_reading_end: currReading ? Number(currReading) : undefined,
      due_date: dueDate || undefined,
      allocation_basis: allocationBasis! };

    if (allocationBasis === 'CUSTOM') {
      const customItems: CustomAllocationItem[] = eligibleTenants.map((t) => {
        const share = Number(customAllocations[t.tenant_id] || 0);
        const percentage = Number(totalAmount) > 0 ? (share / Number(totalAmount)) * 100 : 0;
        return {
          tenant_id: t.tenant_id,
          share_amount: share,
          share_percentage: Number(percentage.toFixed(2)) };
      });
      payload.custom_allocations = customItems;
    }

    try {
      await createBill(payload).unwrap();
      showSuccessAlert('Electricity bill created successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      showErrorAlert(error, 'Create Bill Error');
    } finally {
      submittingRef.current = false;
    }
  };

  const getTenantShare = (tenant: EligibleTenant): string => {
    const total = Number(totalAmount || 0);
    if (total <= 0 || eligibleTenants.length === 0) return '0.00';

    if (allocationBasis === 'CUSTOM') {
      return Number(customAllocations[tenant.tenant_id] || 0).toFixed(2);
    }

    if (allocationBasis === 'RENT_CYCLE_DAYS') {
      const totalDays = eligibleTenants.reduce((sum, t) => sum + t.occupancy_days, 0);
      if (totalDays === 0) return '0.00';
      return ((tenant.occupancy_days / totalDays) * total).toFixed(2);
    }

    // EQUAL (default when no split method selected yet)
    return (total / eligibleTenants.length).toFixed(2);
  };

  const renderAllocationPreview = () => {
    if (allocationBasis === 'EQUAL') {
      const share = eligibleTenants.length > 0 ? (Number(totalAmount || 0) / eligibleTenants.length).toFixed(2) : '0';
      return eligibleTenants.map((t) => (
        <View key={t.tenant_id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: Theme.colors.text.primary }}>{t.name}</Text>
            {t.status === 'CHECKED_OUT_DURING_PERIOD' && (
              <Text style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>
                Checked out during period
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>₹{share}</Text>
        </View>
      ));
    }

    if (allocationBasis === 'CUSTOM') {
      return eligibleTenants.map((t) => (
        <View key={t.tenant_id} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: Theme.colors.text.primary }}>
              {t.name} <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                {t.occupancy_days} days
              </Text>
              {t.status === 'CHECKED_OUT_DURING_PERIOD' && (
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '600' }}>Left</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: Theme.colors.primary + '15',
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRightWidth: 0 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
                ₹
              </Text>
            </View>
            <TextInput
              value={customAllocations[t.tenant_id] || ''}
              onChangeText={(text: string) => setCustomAllocations((prev) => ({ ...prev, [t.tenant_id]: sanitizeNumeric(text) }))}
              placeholder="Share amount"
              keyboardType="numeric"
              returnKeyType={'done'}
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                borderLeftWidth: 0,
                padding: 12,
                fontSize: 14,
                backgroundColor: '#fff' }}
            />
          </View>
        </View>
      ));
    }

    if (allocationBasis === 'RENT_CYCLE_DAYS') {
      const totalDays = eligibleTenants.reduce((sum, t) => sum + t.occupancy_days, 0);
      return (
        <View style={{ gap: 8 }}>
          {eligibleTenants.map((t) => (
            <View key={t.tenant_id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: Theme.colors.text.primary }}>{t.name}</Text>
                {t.status === 'CHECKED_OUT_DURING_PERIOD' && (
                  <Text style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>
                    Checked out during period
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
                  {t.occupancy_days} days
                </Text>
                <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                  {totalDays > 0 ? ((t.occupancy_days / totalDays) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center', marginVertical: 8 }}>
        Select a split method to see how the bill is divided among tenants.
      </Text>
    );
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title="Add Electricity Bill"
      subtitle="Create a room bill and split it among tenants"
      onSubmit={handleSave}
      onCancel={handleClose}
      submitLabel="Save Bill"
      cancelLabel="Cancel"
      isLoading={isLoading}
      minHeightPercent={0.92}
    >
      <View style={{ gap: 16 }}>
        {/* Mandatory indicator */}
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
          <Text style={{ color: '#EF4444' }}>*</Text> Mandatory fields
        </Text>

        {/* Billing month & year */}
        <View style={{ gap: 12 }}>
          <OptionSelector
            label="Billing Month"
            options={monthOptions}
            selectedValue={selectedMonth}
            onSelect={(value) => setSelectedMonth(value || String(today.getMonth()))}
            required
            disabled={fetchingTenants}
          />
          <OptionSelector
            label="Year"
            options={yearOptions}
            selectedValue={selectedYear}
            onSelect={(value) => setSelectedYear(value || String(today.getFullYear()))}
            required
            disabled={fetchingTenants}
          />
        </View>

        <View
          style={{
            padding: 12,
            backgroundColor: '#F0F9FF',
            borderRadius: 10,
            borderLeftWidth: 3,
            borderLeftColor: Theme.colors.primary }}
        >
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 2 }}>
            Bill Period
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
            {formatDisplayDate(periodStart)} - {formatDisplayDate(periodEnd)}
          </Text>
        </View>

        {/* Total amount — mandatory, full-width */}
        <View style={{ marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: Theme.colors.text.primary,
              marginBottom: 6 }}
          >
            Total Amount <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: Theme.colors.primary + '15',
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRightWidth: 0 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
                ₹
              </Text>
            </View>
            <TextInput
              value={totalAmount}
              onChangeText={(text) => setTotalAmount(sanitizeNumeric(text))}
              placeholder="Enter total bill amount"
              keyboardType="numeric"
              returnKeyType={'done'}
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                borderLeftWidth: 0,
                padding: 12,
                fontSize: 14,
                backgroundColor: '#fff' }}
            />
          </View>
        </View>

        {/* Split method — mandatory, full-width */}
        <View>
          <OptionSelector
            label="Split Method"
            options={allocationOptions}
            selectedValue={allocationBasis}
            onSelect={(value) => setAllocationBasis(value as AllocationBasis | null)}
            required
          />
          {allocationBasis && (
            <View
              style={{
                marginTop: 10,
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: Theme.colors.primary }}
            >
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 18 }}>
                {allocationBasis === 'EQUAL' &&
                  'The bill total is divided equally among all active tenants in this room.'}
                {allocationBasis === 'RENT_CYCLE_DAYS' &&
                  'Each tenant is charged based on their actual stay days during the selected bill period.'}
                {allocationBasis === 'CUSTOM' &&
                  'Enter a custom share amount for each active tenant. The total of all shares must equal the bill total.'}
              </Text>
            </View>
          )}
        </View>

        {/* Eligible tenants list */}
        <Card style={{ padding: 16, borderRadius: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
              Eligible Tenants ({eligibleTenants.length})
            </Text>
            {Number(totalAmount || 0) > 0 && !allocationBasis && eligibleTenants.length > 0 && (
              <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                Equal split preview
              </Text>
            )}
          </View>
          {fetchingTenants ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 8 }}>
                Fetching eligible tenants...
              </Text>
            </View>
          ) : eligibleTenants.length === 0 ? (
            <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
              <Text style={{ fontSize: 13, color: '#DC2626', textAlign: 'center' }}>
                No tenants were active in this room during the selected period.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {eligibleTenants.map((t) => (
                <View
                  key={t.tenant_id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 10,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E5E7EB' }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                      {t.name}
                    </Text>
                    {t.phone_no && (
                      <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 2 }}>
                        {t.phone_no}
                      </Text>
                    )}
                    <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 2 }}>
                      {formatDisplayDate(t.check_in_date.split('T')[0])}
                      {t.check_out_date ? ` → ${formatDisplayDate(t.check_out_date.split('T')[0])}` : ' → Present'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View
                      style={{
                        backgroundColor: t.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6 }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: t.status === 'ACTIVE' ? '#059669' : '#D97706' }}
                      >
                        {t.status === 'ACTIVE' ? 'Active' : 'Checked Out'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary }}>
                      {t.occupancy_days} days
                    </Text>
                    {Number(totalAmount || 0) > 0 && (
                      <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.primary }}>
                        ₹{getTenantShare(t)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Allocation preview */}
        {allocationBasis && eligibleTenants.length > 0 && (
          <Card style={{ padding: 16, borderRadius: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 12 }}>
              Bill Split Preview
            </Text>
            {renderAllocationPreview()}
          </Card>
        )}

        {/* Optional details accordion */}
        <View>
          <AnimatedPressableCard
            onPress={() => setOptionalExpanded((prev) => !prev)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB' }}
          >
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                Optional Details
              </Text>
              <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 2 }}>
                Meter reading, due date
              </Text>
            </View>
            <Ionicons
              name={optionalExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Theme.colors.text.secondary}
            />
          </AnimatedPressableCard>

          {optionalExpanded && (
            <View style={{ marginTop: 12, gap: 16 }}>
              {/* Meter reading — optional */}
              <View style={{ marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: Theme.colors.text.primary,
                    marginBottom: 12 }}
                >
                  Meter Reading (optional)
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                      marginBottom: 6 }}
                  >
                    Previous Reading
                  </Text>
                  <TextInput
                    value={prevReading}
                    onChangeText={(text) => setPrevReading(sanitizeNumeric(text))}
                    placeholder="0"
                    keyboardType="numeric"
                    ref={prevReadingRef}
                    returnKeyType={'next'}
                    onSubmitEditing={() => currReadingRef.current?.focus()}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      backgroundColor: '#fff' }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                      marginBottom: 6 }}
                  >
                    Current Reading
                  </Text>
                  <TextInput
                    value={currReading}
                    onChangeText={(text) => setCurrReading(sanitizeNumeric(text))}
                    placeholder="0"
                    keyboardType="numeric"
                    ref={currReadingRef}
                    returnKeyType={'next'}
                    onSubmitEditing={() => ratePerUnitRef.current?.focus()}
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      backgroundColor: '#fff' }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                      marginBottom: 6 }}
                  >
                    Rate per Unit
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        backgroundColor: Theme.colors.primary + '15',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRightWidth: 0 }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
                        ₹
                      </Text>
                    </View>
                    <TextInput
                      value={ratePerUnit}
                      onChangeText={(text) => setRatePerUnit(sanitizeNumeric(text))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      ref={ratePerUnitRef}
                      returnKeyType={'done'}
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                        borderLeftWidth: 0,
                        padding: 12,
                        fontSize: 14,
                        backgroundColor: '#fff' }}
                    />
                  </View>
                </View>

                {prevReading && currReading && ratePerUnit && Number(currReading) > Number(prevReading) && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F0FDF4',
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#BBF7D0' }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, color: '#166534' }}>
                        Units consumed: {Number(currReading) - Number(prevReading)}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '700', marginTop: 2 }}>
                        Auto-calculated total: ₹{totalAmount}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Due date — optional, full-width */}
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                required={false}
              />
            </View>
          )}
        </View>
      </View>
    </SlideBottomModal>
  );
};
