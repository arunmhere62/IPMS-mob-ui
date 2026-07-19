import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Keyboard, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Theme from '@/theme';
import { RootState } from '@/features/owner/store';
import { TenantTicketComment, tenantTicketsApi, useAddTenantTicketCommentMutation, useGetTenantTicketByIdQuery } from '@/features/tenant/api/tenantTicketsApi';
import { useTicketSocket } from '@/hooks/useTicketSocket';


const C = Theme.colors;
const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: '#eff6ff', text: '#1d4ed8' },
  IN_PROGRESS: { bg: '#fff7ed', text: '#c2410c' },
  RESOLVED:    { bg: '#f0fdf4', text: '#166534' },
  CLOSED:      { bg: '#f3f4f6', text: '#6b7280' } };

interface Props {
  navigation: any;
  route: { params: { ticketId: number } };
}

export function TenantTicketDetailScreen({ navigation, route }: Props) {
  const { ticketId } = route.params;
  const accessToken = useSelector((s: RootState) => s.tenantAuth.accessToken);
  const tenantId = useSelector((s: RootState) => s.tenantAuth.tenant?.tenant_id);

  const { data: ticket, isLoading, isFetching, refetch } = useGetTenantTicketByIdQuery(ticketId);
  const [addComment, { isLoading: sending }] = useAddTenantTicketCommentMutation();

  const [message, setMessage] = useState('');
  const [liveComments, setLiveComments] = useState<TenantTicketComment[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const allComments: TenantTicketComment[] = [
    ...(ticket?.tenant_ticket_comments ?? []),
    ...liveComments.filter(
      (lc) => !(ticket?.tenant_ticket_comments ?? []).some((c) => c.s_no === lc.s_no),
    ),
  ];

  const currentStatus = liveStatus ?? ticket?.status ?? 'OPEN';
  const isClosed = currentStatus === 'CLOSED';

  const onNewComment = useCallback((comment: TenantTicketComment) => {
    setLiveComments((prev) => {
      if (prev.some((c) => c.s_no === comment.s_no)) return prev;
      return [...prev, comment];
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const dispatch = useDispatch();

  const onStatusChanged = useCallback(({ status }: { ticketId: number; status: string }) => {
    setLiveStatus(status);
    dispatch(tenantTicketsApi.util.invalidateTags([
      { type: 'TenantTickets' as const, id: 'LIST' },
      { type: 'TenantTicketDetail' as const, id: ticketId },
    ]));
  }, [dispatch, ticketId]);

  useTicketSocket({ token: accessToken, ticketId, onNewComment, onStatusChanged });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage('');
    try {
      await addComment({ ticketId, payload: { message: text } }).unwrap();
    } catch (e: any) {
      Alert.alert('Error', e?.data?.message ?? 'Failed to send');
    }
  };

  useEffect(() => {
    if (allComments.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [ticket]);

  const renderComment = ({ item }: { item: TenantTicketComment }) => {
    const isMe = item.sender_type === 'TENANT';
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && (
          <Text style={styles.senderLabel}>PG Owner</Text>
        )}
        {item.message ? (
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.message}</Text>
        ) : null}
        {Array.isArray(item.attachments) && item.attachments.length > 0 && (
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            📎 {item.attachments.length} attachment(s)
          </Text>
        )}
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  const sc = STATUS_COLORS[currentStatus] ?? STATUS_COLORS.OPEN;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Gradient header */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <AnimatedPressableCard onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </AnimatedPressableCard>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>{ticket?.title ?? 'Ticket'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.statusText, { color: '#fff' }]}>
              {currentStatus.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Ticket info strip */}
      <View style={styles.infoStrip}>
        <Text style={styles.infoChip} numberOfLines={1}>{ticket?.category}</Text>
        <Text style={styles.infoChip} numberOfLines={1}>{ticket?.priority}</Text>
        {ticket?.users && (
          <Text style={styles.infoAssigned} numberOfLines={1} ellipsizeMode="tail">Assigned: {ticket.users.name}</Text>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        data={allComments}
        keyExtractor={(c) => String(c.s_no)}
        renderItem={renderComment}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[C.primary]} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={36} color="#d1d5db" />
            <Text style={styles.emptyChatText}>No messages yet. Start the conversation.</Text>
          </View>
        }
      />

      {/* Input / closed banner — sits just above BottomNav */}
      {isClosed ? (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed-outline" size={14} color="#6b7280" />
          <Text style={styles.closedText}>This ticket is closed</Text>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <AnimatedPressableCard
            style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </AnimatedPressableCard>
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  headerMeta: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 4 },
  infoStrip: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoChip: {
    fontSize: 11, fontWeight: '600', color: '#6b7280',
    backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  infoAssigned: { fontSize: 11, color: '#9ca3af', marginLeft: 'auto', alignSelf: 'center' },
  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    backgroundColor: '#f9fafb', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  closedText: { fontSize: 12, color: '#6b7280' },
  flatList: { flex: 1 },
  chatContent: { padding: 14, flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 8 },
  bubble: { maxWidth: '78%', borderRadius: 14, padding: 10, marginBottom: 6 },
  bubbleMe: { backgroundColor: C.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  senderLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#6b7280', marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 13, color: '#9ca3af', marginTop: 10, textAlign: 'center' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, lineHeight: 18,
    color: '#111827', maxHeight: 100, minHeight: 44, textAlignVertical: 'center' },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 } });
