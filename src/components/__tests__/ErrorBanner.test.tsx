import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBanner } from '../ErrorBanner';

describe('ErrorBanner', () => {
  it('renders null when error is null', () => {
    const { toJSON } = render(<ErrorBanner error={null} onRetry={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('renders error message when error is provided', () => {
    const { getByText } = render(<ErrorBanner error="Network failed" onRetry={jest.fn()} />);
    expect(getByText('Network failed')).toBeTruthy();
  });

  it('renders default title', () => {
    const { getByText } = render(<ErrorBanner error="Error" onRetry={jest.fn()} />);
    expect(getByText('Error Loading Data')).toBeTruthy();
  });

  it('renders custom title when provided', () => {
    const { getByText } = render(<ErrorBanner error="Error" onRetry={jest.fn()} title="Custom Title" />);
    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('renders Retry button', () => {
    const { getByText } = render(<ErrorBanner error="Error" onRetry={jest.fn()} />);
    expect(getByText('Retry')).toBeTruthy();
  });

  it('calls onRetry when Retry is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorBanner error="Error" onRetry={onRetry} />);
    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
