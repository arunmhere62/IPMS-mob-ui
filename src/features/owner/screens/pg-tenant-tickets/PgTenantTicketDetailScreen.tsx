import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import { Theme } from '../../../../theme';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { CONTENT_COLOR } from '@/constant';
import {
  useGetPgTenantTicketByIdQuery,
  useUpdatePgTicketStatusMutation,
  useAddPgTicketCommentMutation,
  PgTicketStatus,
  PgTenantTicketComment,
} from '../../api/pgTicketsApi';
import { useTicketSocket } from '../../../../hooks/useTicketSocket';
import { useFocusEffect } from '@react-navigation/native';

const C = Theme.colors;

const STATUS_OPTIONS: { label: string; value: PgTicketStatus; color: string }[] = [
  { label: 'Open',        value: 'OPEN',        color: '#3b82f6' },
  { label: 'In Progress', value: 'IN_PROGRESS',  color: '#f97316' },
  { label: 'Resolved',    value: 'RESOLVED',     color: '#22c55e' },
  { label: 'Closed',      value: 'CLOSED',       color: '#9ca3af' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: '#eff6ff', text: '#1d4ed8' },
  IN_PROGRESS: { bg: '#fff7ed', text: '#c2410c' },
  RESOLVED:    { bg: '#f0fdf4', text: '#166534' },
  CLOSED:      { bg: '#f3f4f6', text: '#6b7280' },
};

interface Props { navigation: any; route: any }

export function PgTenantTicketDetailScreen({ navigation, route }: Props) {
  const rawId = (route.params as any)?.ticketId;
  const rawPgId = (route.params as any)?.pgId;
  const ticketId: number = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
  const pgId: number | undefined = rawPgId ? (typeof rawPgId === 'string' ? parseInt(rawPgId, 10) : rawPgId) : undefined;
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const [message, setMessage] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [liveComments, setLiveComments] = useState<PgTenantTicketComment[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, isError, error, refetch } = useGetPgTenantTicketByIdQuery({ id: ticketId, pgId });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdatePgTicketStatusMutation();
  const [addComment, { isLoading: sending }] = useAddPgTicketCommentMutation();

  const ticket = data?.ticket;
  const baseComments: PgTenantTicketComment[] = ticket?.tenant_ticket_comments ?? [];
  const comments: PgTenantTicketComment[] = [
    ...baseComments,
    ...liveComments.filter((lc) => !baseComments.some((c) => c.s_no === lc.s_no)),
  ];
  const currentStatus: PgTicketStatus = (liveStatus ?? ticket?.status ?? 'OPEN') as PgTicketStatus;
  const isClosed = currentStatus === 'CLOSED';
  const sc = STATUS_COLORS[currentStatus] ?? STATUS_COLORS.OPEN;

  const onNewComment = useCallback((comment: PgTenantTicketComment) => {
    setLiveComments((prev) => {
      if (prev.some((c) => c.s_no === comment.s_no)) return prev;
      return [...prev, comment];
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const onStatusChanged = useCallback(({ status }: { ticketId: number; status: string }) => {
    setLiveStatus(status);
  }, []);

  useTicketSocket({ token: accessToken, ticketId, onNewComment, onStatusChanged });

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (ticketId) {
        refetch();
      }
    }, [ticketId, refetch])
  );

  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [ticket]);

  const handleStatusChange = async (status: PgTicketStatus) => {
    setShowStatusPicker(false);
    if (status === currentStatus) return;
    try {
      await updateStatus({ id: ticketId, pgId, status }).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage('');
    try {
      await addComment({ id: ticketId, pgId, comment: text }).unwrap();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert('Error', 'Failed to send reply');
      setMessage(text);
    }
  };

  if (isLoading) {
    return (
      <ScreenLayout backgroundColor={C.background?.blue ?? C.primary}>
        <ScreenHeader title="Ticket Detail" showBackButton onBackPress={() => navigation.goBack()} showPGSelector={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (isError || !ticket) {
    const errMsg = (error as any)?.data?.message ?? (error as any)?.error ?? (isError ? 'Failed to load ticket' : 'Ticket not found');
    const errDetail = JSON.stringify(error ?? { isError, data });
    return (
      <ScreenLayout backgroundColor={C.background?.blue ?? C.primary}>
        <ScreenHeader title="Ticket Detail" showBackButton onBackPress={() => navigation.goBack()} showPGSelector={false} />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text style={{ color: '#374151', fontWeight: '600', marginTop: 12 }}>{errMsg}</Text>
          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>id:{String(ticketId)} pgId:{String(pgId)}</Text>
          <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>{errDetail}</Text>
        </View>
      </ScreenLayout>
    );
  }

  const renderComment = ({ item }: { item: PgTenantTicketComment }) => {
    const isOwner = item.sender_type === 'OWNER';
    const tenantName = ticket?.tenants?.name ?? 'Tenant';
    const attachments: string[] = Array.isArray(item.attachments) ? item.attachments.filter(Boolean) : [];
    const hasText = item.message && item.message.trim().length > 0;

    return (
      <View style={[styles.bubble, isOwner ? styles.bubbleOwner : styles.bubbleTenant]}>
        {!isOwner && <Text style={styles.senderLabel}>{tenantName}</Text>}
        {attachments.length > 0 && (
          <View style={styles.attachmentGrid}>
            {attachments.map((url, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setViewerImages(attachments); setViewerIndex(i); }}
                activeOpacity={0.85}
              >
                <Image source={{ uri: url }} style={styles.attachmentThumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {hasText && (
          <Text style={[styles.bubbleText, isOwner && styles.bubbleTextOwner]}>{item.message}</Text>
        )}
        <Text style={[styles.bubbleTime, isOwner && styles.bubbleTimeOwner]}>
          {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <ScreenLayout backgroundColor="#f3f4f6">
      {/* Full-screen image viewer */}
      <Modal visible={viewerImages.length > 0} transparent animationType="fade" onRequestClose={() => setViewerImages([])}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImages([])}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerIndex * 400, y: 0 }}
          >
            {viewerImages.map((url, i) => (
              <View key={i} style={styles.viewerPage}>
                <Image source={{ uri: url }} style={styles.viewerImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          {viewerImages.length > 1 && (
            <Text style={styles.viewerCounter}>{viewerIndex + 1} / {viewerImages.length}</Text>
          )}
        </View>
      </Modal>
      <ScreenHeader
        title={ticket.title}
        subtitle={ticket.tenants?.name ?? 'Tenant'}
        showBackButton
        onBackPress={() => navigation.goBack()}
        showPGSelector={false}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          {/* Info strip */}
          <View style={styles.infoStrip}>
            <View style={styles.infoChipRow}>
              <View style={styles.infoChip}><Text style={styles.infoChipText}>{ticket.category}</Text></View>
              <View style={styles.infoChip}><Text style={styles.infoChipText}>{ticket.priority}</Text></View>
            </View>

            {/* Status selector */}
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: sc.bg }]}
              onPress={() => setShowStatusPicker(v => !v)}
              disabled={updatingStatus}
            >
              {updatingStatus
                ? <ActivityIndicator size="small" color={sc.text} />
                : <>
                    <Text style={[styles.statusBtnText, { color: sc.text }]}>
                      {currentStatus.replace('_', ' ')}
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={sc.text} />
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* Status dropdown */}
          {showStatusPicker && (
            <View style={styles.dropdown}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownItem, currentStatus === opt.value && styles.dropdownItemActive]}
                  onPress={() => handleStatusChange(opt.value)}
                >
                  <View style={[styles.dropdownDot, { backgroundColor: opt.color }]} />
                  <Text style={[styles.dropdownText, currentStatus === opt.value && { fontWeight: '700', color: C.primary }]}>
                    {opt.label}
                  </Text>
                  {currentStatus === opt.value && <Ionicons name="checkmark" size={14} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chat list */}
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(c) => String(c.s_no)}
            renderItem={renderComment}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => comments.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyChatText}>No messages yet.{'\n'}Reply to start the conversation.</Text>
              </View>
            }
          />

          {/* Closed banner */}
          {isClosed && (
            <View style={styles.closedBanner}>
              <Ionicons name="lock-closed-outline" size={14} color="#6b7280" />
              <Text style={styles.closedText}>This ticket is closed</Text>
            </View>
          )}

          {/* Input */}
          {!isClosed && (
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Reply to tenant..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="send" size={18} color="#fff" />
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: CONTENT_COLOR },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CONTENT_COLOR },
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  infoChipRow: { flexDirection: 'row', gap: 6 },
  infoChip: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  infoChipText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  dropdown: {
    position: 'absolute', top: 44, right: 14, zIndex: 99,
    backgroundColor: '#fff', borderRadius: 12, padding: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8, minWidth: 160,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
  dropdownItemActive: { backgroundColor: '#f0f9ff' },
  dropdownDot: { width: 8, height: 8, borderRadius: 4 },
  dropdownText: { fontSize: 13, color: '#374151', flex: 1 },
  chatContent: { flexGrow: 1, justifyContent: 'flex-end', padding: 12 },
  bubble: { maxWidth: '78%', borderRadius: 14, padding: 10, marginBottom: 6 },
  bubbleTenant: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleOwner: { backgroundColor: C.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  senderLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextOwner: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#9ca3af', marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeOwner: { color: 'rgba(255,255,255,0.65)' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 13, color: '#9ca3af', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    backgroundColor: '#f9fafb', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  closedText: { fontSize: 12, color: '#6b7280' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  input: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: 14, color: '#111827', maxHeight: 100,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  attachmentThumb: { width: 110, height: 110, borderRadius: 10, backgroundColor: '#f3f4f6' },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  viewerClose: {
    position: 'absolute', top: 48, right: 18, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6,
  },
  viewerPage: { width: 400, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  viewerImage: { width: 376, height: 500 },
  viewerCounter: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    color: '#fff', fontSize: 14, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
});
