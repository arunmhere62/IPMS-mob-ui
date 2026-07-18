import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TenantOTPVerificationScreen } from '../TenantOTPVerificationScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('TenantOTPVerificationScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<TenantOTPVerificationScreen navigation={mockNavigation as any} route={{ params: { phone: '+919876543210' } } as any} />);
    expect(getByText('Verify OTP')).toBeTruthy();
  });
});
