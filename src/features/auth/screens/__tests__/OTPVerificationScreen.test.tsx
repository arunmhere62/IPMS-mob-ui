import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { OTPVerificationScreen } from '../OTPVerificationScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('OTPVerificationScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      phone: '+919876543210',
    },
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<OTPVerificationScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    expect(getByText('Verify OTP')).toBeTruthy();
  });
});
