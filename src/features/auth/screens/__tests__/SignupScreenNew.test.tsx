import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { SignupScreenNew } from '../SignupScreenNew';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');
jest.mock('@/components/CountryPhoneSelector', () => 'CountryPhoneSelector');

describe('SignupScreenNew', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<SignupScreenNew navigation={mockNavigation as any} />);
    expect(getByText('Sign Up')).toBeTruthy();
  });
});
