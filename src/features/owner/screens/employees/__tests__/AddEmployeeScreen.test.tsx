import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { AddEmployeeScreen } from '../AddEmployeeScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('AddEmployeeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<AddEmployeeScreen navigation={mockNavigation as any} />);
    expect(getByText('Add Employee')).toBeTruthy();
  });
});
