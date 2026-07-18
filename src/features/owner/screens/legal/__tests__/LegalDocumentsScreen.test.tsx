import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { LegalDocumentsScreen } from '../LegalDocumentsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('LegalDocumentsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<LegalDocumentsScreen navigation={mockNavigation as any} route={{ params: {} } as any} />);
    expect(getByText('Legal Documents')).toBeTruthy();
  });
});
