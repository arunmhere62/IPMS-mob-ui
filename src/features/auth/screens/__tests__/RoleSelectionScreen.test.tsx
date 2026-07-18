import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RoleSelectionScreen } from '../RoleSelectionScreen';

describe('RoleSelectionScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    expect(getByText('Welcome')).toBeTruthy();
    expect(getByText('Select your role to continue')).toBeTruthy();
  });

  it('renders tenant button', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    expect(getByText('Tenant')).toBeTruthy();
    expect(getByText('View PG details & pay rent')).toBeTruthy();
  });

  it('renders owner button', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    expect(getByText('PG Owner')).toBeTruthy();
    expect(getByText('Manage properties & operations')).toBeTruthy();
  });

  it('navigates to TenantLogin when tenant button pressed', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    const tenantButton = getByText('Tenant');
    fireEvent.press(tenantButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TenantLogin');
  });

  it('navigates to Login when owner button pressed', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    const ownerButton = getByText('PG Owner');
    fireEvent.press(ownerButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('renders footer text', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RoleSelectionScreen navigation={mockNavigation as any} />
      </NavigationContainer>,
    );
    expect(getByText('By continuing, you agree to our Terms & Privacy Policy')).toBeTruthy();
  });
});
