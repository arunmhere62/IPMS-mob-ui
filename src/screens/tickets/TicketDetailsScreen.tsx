import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchTicketById, addComment, clearCurrentTicket } from '../../store/slices/ticketSlice';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { CONTENT_COLOR } from '@/constant';
import { Ionicons } from '@expo/vector-icons';

interface TicketDetailsScreenProps {
  navigation: any;
  route: any;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return { bg: '#FEE2E2', text: '#EF4444', icon: '🔴' };
    case 'HIGH': return { bg: '#FED7AA', text: '#F59E0B', icon: '🟠' };
    case 'MEDIUM': return { bg: '#FEF3C7', text: '#EAB308', icon: '🟡' };
    case 'LOW': return { bg: '#D1FAE5', text: '#10B981', icon: '🟢' };
    default: return { bg: '#F3F4F6', text: '#6B7280', icon: '⚪' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return { bg: '#DBEAFE', text: '#3B82F6', icon: '🔵' };
    case 'IN_PROGRESS': return { bg: '#E9D5FF', text: '#8B5CF6', icon: '🟣' };
    case 'RESOLVED': return { bg: '#D1FAE5', text: '#10B981', icon: '🟢' };
    case 'CLOSED': return { bg: '#F3F4F6', text: '#6B7280', icon: '⚫' };
    default: return { bg: '#F3F4F6', text: '#6B7280', icon: '⚪' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'BUG': return '🐛';
    case 'FEATURE_REQUEST': return '✨';
    case 'SUPPORT': return '🆘';
    case 'OTHER': return '📌';
    default: return '📋';
  }
};

export const TicketDetailsScreen: React.FC<TicketDetailsScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { ticketId } = route.params;
  const { currentTicket, loading } = useSelector((state: RootState) => state.tickets);
  const { user } = useSelector((state: RootState) => state.auth);

  const [commentText, setCommentText] = useState('');
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadTicketDetails();
    return () => {
      dispatch(clearCurrentTicket());
    };
  }, [ticketId]);

  const loadTicketDetails = () => {
    dispatch(fetchTicketById(ticketId));
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Validation Error', 'Please enter a comment');
      return;
    }

    if (currentTicket?.status === 'CLOSED') {
      Alert.alert('Cannot Add Comment', 'This ticket is closed. Comments cannot be added to closed tickets.');
      return;
    }

    try {
      setSubmittingComment(true);
      await dispatch(addComment({
        ticketId,
        data: {
          comment: commentText.trim(),
          attachments: commentImages, // Always send array, even if empty
        },
      })).unwrap();
      setCommentText('');
      setCommentImages([]);
      Alert.alert('Success', 'Comment added successfully');
      loadTicketDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading && !currentTicket) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Ticket Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CONTENT_COLOR }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading ticket...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!currentTicket) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Ticket Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CONTENT_COLOR }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>❌</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>Ticket Not Found</Text>
        </View>
      </ScreenLayout>
    );
  }

  const priorityColor = getPriorityColor(currentTicket.priority);
  const statusColor = getStatusColor(currentTicket.status);
  const categoryIcon = getCategoryIcon(currentTicket.category);

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={`Ticket #${currentTicket.ticket_number}`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ padding: 16 }}>
              {/* Ticket Info Card */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>{categoryIcon}</Text>
                      <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, fontWeight: '600' }}>
                        {currentTicket.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                      {currentTicket.title}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: priorityColor.bg,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: priorityColor.text }}>
                      {priorityColor.icon} {currentTicket.priority}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 15, color: Theme.colors.text.primary, lineHeight: 22, marginBottom: 16 }}>
                  {currentTicket.description}
                </Text>

                {/* Screenshots */}
                {currentTicket.attachments && currentTicket.attachments.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                      Screenshots
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {currentTicket.attachments.map((url: string, index: number) => (
                        <Image
                          key={index}
                          source={{ uri: url }}
                          style={{ width: 80, height: 80, borderRadius: 8 }}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Status & Meta Info */}
                <View style={{ borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Status</Text>
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: statusColor.bg,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor.text }}>
                        {statusColor.icon} {currentTicket.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Reported By</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                      {currentTicket.users_issue_tickets_reported_byTousers?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Created</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                      {new Date(currentTicket.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Comments Section */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                  💬 Comments ({currentTicket.issue_ticket_comments?.length || 0})
                </Text>

                {/* Comments List */}
                {currentTicket.issue_ticket_comments && currentTicket.issue_ticket_comments.length > 0 ? (
                  currentTicket.issue_ticket_comments.map((comment: any) => (
                    <View
                      key={comment.s_no}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                          {comment.users?.name || 'Unknown User'}
                        </Text>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: Theme.colors.text.primary, lineHeight: 20 }}>
                        {comment.comment}
                      </Text>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                          {comment.attachments.map((url: string, index: number) => (
                            <Image
                              key={index}
                              source={{ uri: url }}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center', paddingVertical: 20 }}>
                    No comments yet. Be the first to comment!
                  </Text>
                )}

                {/* Add Comment */}
                {currentTicket.status === 'CLOSED' ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 16, marginTop: 8 }}>
                    <View style={{
                      backgroundColor: '#FEF3C7',
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="lock-closed" size={20} color="#D97706" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 14, color: '#92400E', flex: 1, lineHeight: 20 }}>
                        This ticket is closed. Comments cannot be added to closed tickets.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 16, marginTop: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                      Add Comment
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: Theme.colors.border,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        backgroundColor: '#fff',
                        minHeight: 80,
                        textAlignVertical: 'top',
                        marginBottom: 12,
                      }}
                      placeholder="Write your comment..."
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      numberOfLines={4}
                    />
                    <ImageUploadS3
                      label="Attach Images (Optional)"
                      images={commentImages}
                      onImagesChange={setCommentImages}
                      maxImages={3}
                      folder="tickets/images"
                    />
                    <TouchableOpacity
                      onPress={handleAddComment}
                      disabled={submittingComment || !commentText.trim()}
                      style={{
                        backgroundColor: (submittingComment || !commentText.trim()) ? '#9CA3AF' : Theme.colors.primary,
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: 'center',
                        marginTop: 12,
                      }}
                    >
                      {submittingComment ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                          Post Comment
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenLayout>
  );
};
