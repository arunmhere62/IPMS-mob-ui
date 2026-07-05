import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActions } from '../QuickActions';

const mockItems = [
  { title: 'Quick Setup', icon: 'flash', screen: 'QuickSetup', color: '#6366F1' },
  { title: 'Rooms', icon: 'bed', screen: 'Rooms', color: '#3B82F6' },
  { title: 'Tenants', icon: 'people', screen: 'Tenants', color: '#10B981' },
  { title: 'Expenses', icon: 'wallet', screen: 'Expenses', color: '#F59E0B' },
  { title: 'Vacancies', icon: 'calendar', screen: 'UpcomingVacancies', color: '#EF4444' },
];

describe('QuickActions', () => {
  it('renders the section title', () => {
    const { getByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={jest.fn()} />
    );
    expect(getByText('Quick Actions')).toBeTruthy();
  });

  it('renders all menu item titles', () => {
    const { getByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={jest.fn()} />
    );
    mockItems.forEach(item => {
      expect(getByText(item.title)).toBeTruthy();
    });
  });

  it('calls onNavigate with correct screen when pressed', () => {
    const onNavigate = jest.fn();
    const { getByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={onNavigate} />
    );
    fireEvent.press(getByText('Rooms'));
    expect(onNavigate).toHaveBeenCalledWith('Rooms');
  });

  it('renders default subtitles from SUBTITLES map', () => {
    const items = [{ title: 'Rooms', icon: 'bed', screen: 'Rooms', color: '#3B82F6' }];
    const { getByText } = render(
      <QuickActions menuItems={items} onNavigate={jest.fn()} />
    );
    expect(getByText('Rooms & beds')).toBeTruthy();
  });

  it('renders custom subtitle when provided', () => {
    const items = [{ title: 'Custom', icon: 'star', screen: 'Custom', color: '#000', subtitle: 'My subtitle' }];
    const { getByText } = render(
      <QuickActions menuItems={items} onNavigate={jest.fn()} />
    );
    expect(getByText('My subtitle')).toBeTruthy();
  });

  it('shows tour hint badge when tourHintScreen matches', () => {
    const { getByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={jest.fn()} tourHintScreen="QuickSetup" />
    );
    expect(getByText('Tap here to start')).toBeTruthy();
  });

  it('shows rooms tour hint when tourHintScreen is Rooms', () => {
    const { getByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={jest.fn()} tourHintScreen="Rooms" />
    );
    expect(getByText('Tap to view rooms')).toBeTruthy();
  });

  it('does not show tour hint when tourHintScreen is null', () => {
    const { queryByText } = render(
      <QuickActions menuItems={mockItems} onNavigate={jest.fn()} tourHintScreen={null} />
    );
    expect(queryByText('Tap here to start')).toBeNull();
    expect(queryByText('Tap to view rooms')).toBeNull();
  });

  it('handles empty menu items without crashing', () => {
    const { getByText } = render(
      <QuickActions menuItems={[]} onNavigate={jest.fn()} />
    );
    expect(getByText('Quick Actions')).toBeTruthy();
  });

  it('handles single menu item', () => {
    const items = [{ title: 'Solo', icon: 'star', screen: 'Solo', color: '#000' }];
    const { getByText } = render(
      <QuickActions menuItems={items} onNavigate={jest.fn()} />
    );
    expect(getByText('Solo')).toBeTruthy();
  });
});
