import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { OrganizationsScreen } from '../OrganizationsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('OrganizationsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<OrganizationsScreen navigation={mockNavigation as any} />);
    expect(getByText('Organizations')).toBeTruthy();
  });
});
