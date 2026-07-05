import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('renders text input', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter name" />);
    expect(getByPlaceholderText('Enter name')).toBeTruthy();
  });

  it('renders label when provided', () => {
    const { getByText } = render(<Input label="Username" placeholder="Enter" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    const { queryByText } = render(<Input placeholder="Enter" />);
    expect(queryByText('Username')).toBeNull();
  });

  it('renders error message when error is provided', () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('does not render error message when error is not provided', () => {
    const { queryByText } = render(<Input placeholder="Enter" />);
    expect(queryByText('This field is required')).toBeNull();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Enter'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('passes through TextInputProps', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter" keyboardType="numeric" maxLength={10} />
    );
    const input = getByPlaceholderText('Enter');
    expect(input.props.keyboardType).toBe('numeric');
    expect(input.props.maxLength).toBe(10);
  });

  it('renders with both label and error', () => {
    const { getByText } = render(
      <Input label="Email" error="Invalid email" placeholder="Enter email" />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Invalid email')).toBeTruthy();
  });
});
