import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionSelector } from '../OptionSelector';

const mockOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

describe('OptionSelector', () => {
  it('renders label', () => {
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={jest.fn()} />
    );
    expect(getByText(/Gender/)).toBeTruthy();
  });

  it('renders all option labels', () => {
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={jest.fn()} />
    );
    mockOptions.forEach(opt => {
      expect(getByText(opt.label)).toBeTruthy();
    });
  });

  it('renders required indicator when required', () => {
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={jest.fn()} required />
    );
    expect(getByText('*')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={jest.fn()} description="Select gender" />
    );
    expect(getByText('Select gender')).toBeTruthy();
  });

  it('renders error message when provided', () => {
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={jest.fn()} error="Required field" />
    );
    expect(getByText('Required field')).toBeTruthy();
  });

  it('calls onSelect with value when unselected option is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={onSelect} />
    );
    fireEvent.press(getByText('Male'));
    expect(onSelect).toHaveBeenCalledWith('male');
  });

  it('calls onSelect with null when already selected option is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue="male" onSelect={onSelect} />
    );
    fireEvent.press(getByText('Male'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('renders option with icon prefix', () => {
    const options = [{ label: 'Male', value: 'male', icon: '♂' }];
    const { getByText } = render(
      <OptionSelector label="Gender" options={options} selectedValue={null} onSelect={jest.fn()} />
    );
    expect(getByText(/♂.*Male/)).toBeTruthy();
  });

  it('does not call onSelect when disabled', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <OptionSelector label="Gender" options={mockOptions} selectedValue={null} onSelect={onSelect} disabled />
    );
    fireEvent.press(getByText('Male'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
