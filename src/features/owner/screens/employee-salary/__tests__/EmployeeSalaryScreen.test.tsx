import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { EmployeeSalaryScreen } from '../EmployeeSalaryScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('EmployeeSalaryScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<EmployeeSalaryScreen navigation={mockNavigation as any} />);
    expect(getByText('Employee Salary')).toBeTruthy();
  });
});
