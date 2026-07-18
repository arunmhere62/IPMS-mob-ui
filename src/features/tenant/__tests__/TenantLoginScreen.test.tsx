import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TenantLoginScreen } from '../TenantLoginScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');
jest.mock('@/components/CountryPhoneSelector', () => 'CountryPhoneSelector');

describe('TenantLoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<TenantLoginScreen navigation={mockNavigation as any} />);
    expect(getByText('Login')).toBeTruthy();
  });
});
