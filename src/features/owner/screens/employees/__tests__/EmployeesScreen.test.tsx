import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { EmployeesScreen } from '../EmployeesScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('EmployeesScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<EmployeesScreen navigation={mockNavigation as any} />);
    expect(getByText('Employees')).toBeTruthy();
  });
});
