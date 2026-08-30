import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ENV } from '@/config/environment';

import { RoleSelectionScreen } from '@/features/auth/screens/RoleSelectionScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { OTPVerificationScreen } from '@/features/auth/screens/OTPVerificationScreen';
// In-app business/organization signup is disabled on iOS per App Store
// Guideline 3.1.1. iOS users register on the website instead.
// See: LoginScreen "Sign Up" button -> Linking.openURL(WEB_SIGNUP_URL).
import { SignupScreenNew } from '@/features/auth/screens/SignupScreenNew';
import { SignupOtpScreen } from '@/features/auth/screens/SignupOtpScreen';
import { LegalDocumentsScreen } from '@/features/owner/screens/legal/LegalDocumentsScreen';
import { LegalWebViewScreen } from '@/features/owner/screens/legal/LegalWebViewScreen';

import { TenantLoginScreen } from '@/features/tenant/TenantLoginScreen';
import { TenantOTPVerificationScreen } from '@/features/tenant/TenantOTPVerificationScreen';

import { stackScreenOptions } from './navigationTheme';

// Only register in-app signup routes on non-iOS platforms.
// Exception: when APP_ENV is local or development, allow in-app signup on iOS
// too (useful for testing). Production iOS still redirects to the website
// per App Store Guideline 3.1.1.
const showInAppSignup = Platform.OS !== 'ios' || ENV.IS_LOCAL || ENV.IS_DEVELOPMENT;

const Stack = createNativeStackNavigator();

export type AuthStackParamList = {
  RoleSelection: undefined;
  Login: undefined;
  TenantLogin: undefined;
  Signup: undefined;
  SignupOtp: undefined;
  OTPVerification: undefined;
  LegalDocuments: undefined;
  LegalWebView: undefined;
  TenantOTPVerification: undefined;
};

interface AuthScreensProps {
  initialRouteName: string;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ initialRouteName }) => (
  <Stack.Navigator initialRouteName={initialRouteName as any} screenOptions={stackScreenOptions}>
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="TenantLogin" component={TenantLoginScreen} />
    {showInAppSignup && (
      <>
        <Stack.Screen name="Signup" component={SignupScreenNew} />
        <Stack.Screen name="SignupOtp" component={SignupOtpScreen} />
      </>
    )}
    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <Stack.Screen
      name="LegalDocuments"
      component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>}
    />
    <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
    <Stack.Screen name="TenantOTPVerification" component={TenantOTPVerificationScreen} />
  </Stack.Navigator>
);
