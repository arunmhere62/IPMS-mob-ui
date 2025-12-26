import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await onSave({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      showSuccessAlert('Password changed successfully');
      handleClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      showErrorAlert(error, 'Password Error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: Theme.colors.canvas,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: Theme.colors.border,
              }}
            >
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Change Password
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 4 }}>
                  Update your account password
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} disabled={loading}>
                <Ionicons name="close" size={24} color={Theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={{ padding: 20 }}>
              {/* Current Password */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Current Password <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: errors.currentPassword ? Theme.colors.danger : Theme.colors.input.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.text.tertiary} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: Theme.colors.text.primary,
                    }}
                    placeholder="Enter current password"
                    placeholderTextColor={Theme.colors.input.placeholder}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons
                      name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.currentPassword}
                  </Text>
                )}
              </View>

              {/* New Password */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  New Password <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: errors.newPassword ? Theme.colors.danger : Theme.colors.input.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.text.tertiary} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: Theme.colors.text.primary,
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor={Theme.colors.input.placeholder}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.newPassword}
                  </Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Confirm New Password <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: errors.confirmPassword ? Theme.colors.danger : Theme.colors.input.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.text.tertiary} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: Theme.colors.text.primary,
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor={Theme.colors.input.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border,
                backgroundColor: Theme.colors.canvas,
              }}
            >
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: Theme.colors.light,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: loading ? Theme.colors.light : Theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
