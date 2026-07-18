import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card><Text>Card content</Text></Card>
    );
    expect(getByText('Card content')).toBeTruthy();
  });

  it('renders without crashing with custom className', () => {
    const { getByText } = render(
      <Card className="custom-class"><Text>Content</Text></Card>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('renders with default props', () => {
    const { getByText } = render(
      <Card><Text>Content</Text></Card>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('applies elevation when provided', () => {
    const { toJSON } = render(
      <Card elevation={5}><Text>Content</Text></Card>
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"elevation":5');
  });

  it('passes through other ViewProps', () => {
    const { getByTestId } = render(
      <Card testID="my-card"><Text>Content</Text></Card>
    );
    expect(getByTestId('my-card')).toBeTruthy();
  });

  it('renders with custom backgroundColor prop', () => {
    const { getByText } = render(
      <Card backgroundColor="bg-blue-100"><Text>Content</Text></Card>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('renders with custom shadowColor prop', () => {
    const { getByText } = render(
      <Card shadowColor="shadow-lg"><Text>Content</Text></Card>
    );
    expect(getByText('Content')).toBeTruthy();
  });
});
