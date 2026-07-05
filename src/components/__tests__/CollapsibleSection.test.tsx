import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CollapsibleSection, THEME_PRESETS } from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders title', () => {
    const { getByText } = render(
      <CollapsibleSection title="Section" expanded={false} onToggle={jest.fn()}>
        <Text>Content</Text>
      </CollapsibleSection>
    );
    expect(getByText('Section')).toBeTruthy();
  });

  it('renders item count when provided', () => {
    const { getByText } = render(
      <CollapsibleSection title="Items" itemCount={5} expanded={false} onToggle={jest.fn()}>
        <Text>Content</Text>
      </CollapsibleSection>
    );
    expect(getByText('Items (5)')).toBeTruthy();
  });

  it('does not render content when collapsed', () => {
    const { queryByText } = render(
      <CollapsibleSection title="Section" expanded={false} onToggle={jest.fn()}>
        <Text>Hidden content</Text>
      </CollapsibleSection>
    );
    expect(queryByText('Hidden content')).toBeNull();
  });

  it('renders content when expanded', () => {
    const { getByText } = render(
      <CollapsibleSection title="Section" expanded={true} onToggle={jest.fn()}>
        <Text>Visible content</Text>
      </CollapsibleSection>
    );
    expect(getByText('Visible content')).toBeTruthy();
  });

  it('calls onToggle when header is pressed', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <CollapsibleSection title="Section" expanded={false} onToggle={onToggle}>
        <Text>Content</Text>
      </CollapsibleSection>
    );
    fireEvent.press(getByText('Section'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders with string theme preset', () => {
    const { getByText } = render(
      <CollapsibleSection title="Section" expanded={false} onToggle={jest.fn()} theme="lightBlue">
        <Text>Content</Text>
      </CollapsibleSection>
    );
    expect(getByText('Section')).toBeTruthy();
  });

  it('renders with custom theme object', () => {
    const { getByText } = render(
      <CollapsibleSection
        title="Section"
        expanded={false}
        onToggle={jest.fn()}
        theme={{ headerBackgroundColor: '#FF0000', headerTextColor: '#FFFFFF' }}
      >
        <Text>Content</Text>
      </CollapsibleSection>
    );
    expect(getByText('Section')).toBeTruthy();
  });
});

describe('THEME_PRESETS', () => {
  it('has light preset', () => {
    expect(THEME_PRESETS.light).toBeDefined();
    expect(THEME_PRESETS.light.headerBackgroundColor).toBe('#F3F4F6');
  });

  it('has lightBlue preset', () => {
    expect(THEME_PRESETS.lightBlue).toBeDefined();
    expect(THEME_PRESETS.lightBlue.headerBackgroundColor).toBe('#EFF6FF');
  });

  it('has lightGreen preset', () => {
    expect(THEME_PRESETS.lightGreen).toBeDefined();
  });

  it('has lightOrange preset', () => {
    expect(THEME_PRESETS.lightOrange).toBeDefined();
  });

  it('has lightPurple preset', () => {
    expect(THEME_PRESETS.lightPurple).toBeDefined();
  });

  it('all presets have required color fields', () => {
    Object.values(THEME_PRESETS).forEach(preset => {
      expect(preset.headerBackgroundColor).toBeDefined();
      expect(preset.headerTextColor).toBeDefined();
      expect(preset.containerBackgroundColor).toBeDefined();
      expect(preset.iconColor).toBeDefined();
      expect(preset.chevronColor).toBeDefined();
    });
  });
});
