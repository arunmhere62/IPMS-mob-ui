import React from 'react';
import { renderWithProviders } from '@/test-utils';
import EmployeeDetailsScreen from '../EmployeeDetailsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('EmployeeDetailsScreen', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<EmployeeDetailsScreen />);
    expect(getByText('Employee Details')).toBeTruthy();
  });
});
