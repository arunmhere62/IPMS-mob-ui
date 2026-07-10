import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { AddTenantScreen } from '../AddTenantScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('AddTenantScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<AddTenantScreen navigation={mockNavigation as any} />);
    expect(getByText('Add Tenant')).toBeTruthy();
  });
});
