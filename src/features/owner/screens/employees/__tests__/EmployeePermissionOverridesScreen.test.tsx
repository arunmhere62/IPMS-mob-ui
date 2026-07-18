import React from 'react';
import { renderWithProviders } from '@/test-utils';
import EmployeePermissionOverridesScreen from '../EmployeePermissionOverridesScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('EmployeePermissionOverridesScreen', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<EmployeePermissionOverridesScreen />);
    expect(getByText('Permission Overrides')).toBeTruthy();
  });
});
