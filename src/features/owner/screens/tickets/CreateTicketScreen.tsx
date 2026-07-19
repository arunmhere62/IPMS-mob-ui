import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCreateTicketMutation } from '@/features/owner/api/ticketsApi';
import { Card } from '@/components/Card';
import { Theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenLayout } from '@/components/ScreenLayout';
import { SearchableDropdown } from '@/components/SearchableDropdown';
import { ImageUploadS3 } from '@/components/ImageUploadS3';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface CreateTicketScreenProps {
  navigation: any;
}

export const CreateTicketScreen: React.FC<CreateTicketScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [createTicketMutation, { isLoading: loading }] = useCreateTicketMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const categoryOptions = [
    { id: 1, label: '🐛 Bug', value: 'BUG' },
    { id: 2, label: '✨ Feature Request', value: 'FEATURE_REQUEST' },
    { id: 3, label: '🆘 Support', value: 'SUPPORT' },
    { id: 4, label: '📌 Other', value: 'OTHER' },
  ];

  const priorityOptions = [
    { id: 1, label: '🟢 Low', value: 'LOW' },
    { id: 2, label: '🟡 Medium', value: 'MEDIUM' },
    { id: 3, label: '🟠 High', value: 'HIGH' },
    { id: 4, label: '🔴 Critical', value: 'CRITICAL' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }

    if (!priority) {
      Alert.alert('Validation Error', 'Please select a priority');
      return;
    }

    try {
      const res = await createTicketMutation({
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        priority: priority as any,
        attachments: screenshots.length > 0 ? screenshots : undefined,
        pg_id: selectedPGLocationId || undefined }).unwrap();

      showSuccessAlert(res);
      navigation.goBack();
    } catch (error: unknown) {
      showErrorAlert(error, 'Create Ticket Error');
    }
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Report Issue"
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ padding: 16 }}>
              {/* Issue Details */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                  📝 Issue Details
                </Text>

                {/* Title */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Title <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      lineHeight: 18,
                      backgroundColor: '#fff',
                      minHeight: 44,
                      textAlignVertical: 'center' }}
                    placeholder="Brief description of the issue"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Description */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Description <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      lineHeight: 18,
                      backgroundColor: '#fff',
                      minHeight: 120,
                      textAlignVertical: 'top' }}
                    placeholder="Detailed description of the issue..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                  />
                </View>

                {/* Category */}
                <View style={{ marginBottom: 16 }}>
                  <SearchableDropdown
                    label="Category"
                    placeholder="Select category"
                    items={categoryOptions}
                    selectedValue={categoryOptions.find(c => c.value === category)?.id || null}
                    onSelect={(item) => setCategory(item.value)}
                    loading={false}
                    required={true}
                  />
                </View>

                {/* Priority */}
                <View style={{ marginBottom: 16 }}>
                  <SearchableDropdown
                    label="Priority"
                    placeholder="Select priority"
                    items={priorityOptions}
                    selectedValue={priorityOptions.find(p => p.value === priority)?.id || null}
                    onSelect={(item) => setPriority(item.value)}
                    loading={false}
                    required={true}
                  />
                </View>

                {/* Screenshots */}
                <View style={{ marginBottom: 0 }}>
                  <ImageUploadS3
                    label="Screenshots (Optional)"
                    images={screenshots}
                    onImagesChange={setScreenshots}
                    maxImages={5}
                    folder="tickets/images"
                  />
                  <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 4 }}>
                    Add screenshots to help us understand the issue better
                  </Text>
                </View>
              </Card>

              {/* Info Card */}
              <Card style={{ padding: 16, marginBottom: 16, backgroundColor: '#EFF6FF' }}>
                <Text style={{ fontSize: 12, color: '#3B82F6', lineHeight: 18 }}>
                  💡 <Text style={{ fontWeight: '600' }}>Tip:</Text> Please provide as much detail as possible to help us resolve your issue quickly.
                </Text>
              </Card>

              {/* Submit Button */}
              <AnimatedPressableCard
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9CA3AF' : Theme.colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 20 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    Submit Ticket
                  </Text>
                )}
              </AnimatedPressableCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenLayout>
  );
};
