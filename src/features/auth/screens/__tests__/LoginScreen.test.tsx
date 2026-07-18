import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { LoginScreen } from '../LoginScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('LoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<LoginScreen navigation={mockNavigation as any} />);
    expect(getByText('Login')).toBeTruthy();
  });
});
