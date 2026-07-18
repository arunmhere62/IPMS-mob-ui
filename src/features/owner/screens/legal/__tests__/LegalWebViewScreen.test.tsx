import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { LegalWebViewScreen } from '../LegalWebViewScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

describe('LegalWebViewScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<LegalWebViewScreen navigation={mockNavigation as any} route={{ params: { url: 'https://example.com' } } as any} />);
    expect(getByText('Legal Document')).toBeTruthy();
  });
});
