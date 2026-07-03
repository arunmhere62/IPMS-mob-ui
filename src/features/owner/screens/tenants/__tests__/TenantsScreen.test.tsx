import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TenantsScreen } from '../TenantsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('TenantsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<TenantsScreen navigation={mockNavigation as any} />);
    expect(getByText('Tenants')).toBeTruthy();
  });
});
