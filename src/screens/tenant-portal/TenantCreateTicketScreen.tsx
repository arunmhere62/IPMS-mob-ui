import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';
import { BottomNav } from '../../components/BottomNav';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import {
  useCreateTenantTicketMutation,
  useAddTenantTicketCommentMutation,
  TenantTicketCategory,
  TenantTicketPriority,
} from '../../services/api/tenantTicketsApi';

const C = Theme.colors;
const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

const tenantTabs = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'payments', label: 'Payments', icon: 'card' },
  { name: 'tickets', label: 'Tickets', icon: 'ticket-outline' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

const CATEGORIES: { label: string; value: TenantTicketCategory; icon: string }[] = [
  { label: 'Maintenance', value: 'MAINTENANCE', icon: 'construct-outline' },
  { label: 'Complaint',   value: 'COMPLAINT',   icon: 'alert-circle-outline' },
  { label: 'Request',     value: 'REQUEST',     icon: 'hand-left-outline' },
  { label: 'Other',       value: 'OTHER',       icon: 'help-circle-outline' },
];

const PRIORITIES: { label: string; value: TenantTicketPriority; color: string }[] = [
  { label: 'Low',    value: 'LOW',    color: '#22c55e' },
  { label: 'Medium', value: 'MEDIUM', color: '#f97316' },
  { label: 'High',   value: 'HIGH',   color: '#ef4444' },
];

interface Props { navigation: any }

export function TenantCreateTicketScreen({ navigation }: Props) {
  const [category, setCategory] = useState<TenantTicketCategory>('MAINTENANCE');
  const [priority, setPriority] = useState<TenantTicketPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  const [createTicket, { isLoading }] = useCreateTenantTicketMutation();
  const [addComment] = useAddTenantTicketCommentMutation();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for the ticket');
      return;
    }
    try {
      const ticket = await createTicket({
        category, priority,
        title: title.trim(),
        description: description.trim() || undefined,
      }).unwrap();

      if (attachmentUrls.length > 0) {
        await addComment({ ticketId: ticket.s_no, payload: { attachments: attachmentUrls } }).unwrap();
      }

      Alert.alert('Done', 'Ticket raised successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.data?.message ?? 'Failed to create ticket');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Tenant Portal</Text>
          <Text style={styles.headerSub}>Raise a Ticket</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.selectChip, category === cat.value && styles.selectChipActive]}
              onPress={() => setCategory(cat.value)}
            >
              <Ionicons name={cat.icon as any} size={16} color={category === cat.value ? '#fff' : '#6b7280'} />
              <Text style={[styles.selectChipText, category === cat.value && styles.selectChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.row}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.priorityChip, priority === p.value && { backgroundColor: p.color, borderColor: p.color }]}
              onPress={() => setPriority(p.value)}
            >
              <Text style={[styles.priorityChipText, priority === p.value && { color: '#fff' }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Brief title of the issue"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          maxLength={255}
        />

        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Attachments */}
        <ImageUploadS3
          images={attachmentUrls}
          onImagesChange={setAttachmentUrls}
          maxImages={2}
          label="Attachments (optional)"
          folder="tickets/attachments"
          useS3={true}
          disabled={isLoading}
        />

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Ticket</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <BottomNav tabs={tenantTabs} activeTab="tickets" onTabPress={(tab) => {
        if (tab !== 'tickets') navigation.navigate('TenantDashboard');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background?.secondary ?? '#f3f4f6' },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  content: { padding: 20, gap: 6, paddingBottom: 110 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  required: { color: '#ef4444' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  selectChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  selectChipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  selectChipTextActive: { color: '#fff' },
  priorityChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  priorityChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827',
  },
  textArea: { minHeight: 110 },
  submitBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
