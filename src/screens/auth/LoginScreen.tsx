import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Theme } from '../../theme';
import { sendOtp } from '../../store/slices/authSlice';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { RootState, AppDispatch } from '../../store';

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
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

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
      await dispatch(sendOtp(fullPhone)).unwrap();
      Alert.alert('Success', 'OTP sent successfully to your phone number');
      navigation.navigate('OTPVerification', { phone: fullPhone });
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to send OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.background.primary }}
      behavior="padding"
    >
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
          loading={loading}
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
      </Card>
      </View>
    </KeyboardAvoidingView>
  );
};
