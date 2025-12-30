import React, { useState } from 'react';
import { View, Text, Alert, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import { useSendOtpMutation } from '../../services/api/authApi';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { API_BASE_URL } from '../../config';

interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  phoneLength: number;
}

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    phoneLength: 10,
  });
  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();
  const [testingNotification, setTestingNotification] = useState(false);

  // Simple test notification function
  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      console.log('[TEST] 🧪 Testing push notification with static payload...');
      
      // Call backend with static test payload
      const response = await fetch(`${API_BASE_URL}/notifications/test-static`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '🎉 Test Notification',
          body: 'This is a static test notification from LoginScreen',
          data: {
            type: 'TEST',
            source: 'login_screen',
            timestamp: new Date().toISOString(),
          }
        }),
      });

      const responseText = await response.text();
      console.log('[TEST] Backend response:', {
        status: response.status,
        ok: response.ok,
        body: responseText,
      });

      if (response.ok) {
        Alert.alert(
          '✅ Test Sent',
          'Static test notification sent!\n\nCheck your device for the notification.\n\nLogs: adb logcat | findstr /i "PUSH"',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Test Failed',
          `Backend error: ${response.status}\n\n${responseText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[TEST] ❌ Test notification failed:', error);
      Alert.alert(
        '❌ Error',
        `Failed to send test notification:\n\n${error?.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setTestingNotification(false);
    }
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      return;
    }

    try {
      // Send phone with country code and space
      const fullPhone = selectedCountry.phoneCode + ' ' + phone;
      const res = await sendOtp({ phone: fullPhone }).unwrap();
      showSuccessAlert(res);
      navigation.navigate('OTPVerification', { phone: fullPhone });
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.background.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ 
          flex: 1,
          justifyContent: 'center', 
          padding: Theme.spacing.lg 
        }}>
          <View style={{ marginBottom: Theme.spacing.xl }}>
            <Text style={{ 
              fontSize: Theme.typography.fontSize['4xl'], 
              fontWeight: Theme.typography.fontWeight.bold, 
              color: Theme.colors.primary, 
              textAlign: 'center', 
              marginBottom: Theme.spacing.sm 
            }}>
              PG Management
            </Text>
            <Text style={{ 
              fontSize: Theme.typography.fontSize.base, 
              color: Theme.colors.text.secondary, 
              textAlign: 'center' 
            }}>
              Login to manage your PG operations
            </Text>
          </View>

          <Card className="mb-6 shadow-none">
            <Text className="text-2xl font-semibold text-dark mb-6">Login</Text>
            
            {/* Country + Phone in Single Row */}
            <CountryPhoneSelector
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
              size="large"
              phoneValue={phone}
              onPhoneChange={(text: string) => {
                setPhone(text);
                setPhoneError('');
              }}
            />

            {/* Error Message */}
            {phoneError && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, marginLeft: 4 }}>
                {phoneError}
              </Text>
            )}

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={sendingOtp}
              variant="primary"
              size="md"
            />
            
            <Text className='mt-6' style={{ 
              fontSize: Theme.typography.fontSize.sm, 
              color: Theme.colors.text.secondary, 
              textAlign: 'center', 
              marginBottom: Theme.spacing.md 
            }}>
              You will receive a 6-digit OTP on your registered phone number
            </Text>

            <View style={{ marginTop: Theme.spacing.lg }}>
              <Button
                title="Create New Account"
                onPress={() => navigation.navigate('Signup')}
                variant="outline"
                size='md'
              />
            </View>

            {/* Test Push Notification Button */}
            <View style={{ marginTop: Theme.spacing.md, paddingTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <Text style={{ 
                fontSize: 12, 
                color: Theme.colors.text.secondary, 
                textAlign: 'center', 
                marginBottom: Theme.spacing.sm 
              }}>
                🧪 Push Notification Test
              </Text>
              
              <TouchableOpacity
                onPress={handleTestNotification}
                disabled={testingNotification}
                style={{
                  backgroundColor: testingNotification ? '#9CA3AF' : '#F59E0B',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {testingNotification ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                      Sending Test...
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                    📱 Send Test Notification
                  </Text>
                )}
              </TouchableOpacity>
              
              <Text style={{ 
                fontSize: 10, 
                color: '#6B7280', 
                textAlign: 'center', 
                marginTop: 8,
                fontStyle: 'italic'
              }}>
                Tests Firebase setup & backend integration
              </Text>
            </View>
          </Card>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
