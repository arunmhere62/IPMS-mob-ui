import React from 'react';
import { Text, View } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { OnboardingTourProvider, useOnboardingTour, type TourStep } from '../OnboardingTourContext';

const Consumer = () => {
  const ctx = useOnboardingTour();
  return (
    <View>
      <Text testID="step">{ctx.tourStep ?? 'idle'}</Text>
      <Text testID="startOnboarding" onPress={ctx.startOnboardingTour}>startOnboarding</Text>
      <Text testID="startRooms" onPress={ctx.startRoomsFromDashboardTour}>startRooms</Text>
      <Text testID="startRoom" onPress={ctx.startRoomTour}>startRoom</Text>
      <Text testID="startBed" onPress={ctx.startBedTour}>startBed</Text>
      <Text testID="startTenant" onPress={ctx.startTenantTour}>startTenant</Text>
      <Text testID="startRent" onPress={ctx.startRentTour}>startRent</Text>
      <Text testID="advance" onPress={ctx.advanceTour}>advance</Text>
      <Text testID="end" onPress={ctx.endTour}>end</Text>
    </View>
  );
};

const renderTour = () => render(
  <OnboardingTourProvider>
    <Consumer />
  </OnboardingTourProvider>
);

const getStep = (utils: ReturnType<typeof render>) =>
  utils.getByTestId('step').props.children;

const press = (utils: ReturnType<typeof render>, id: string) =>
  act(() => { utils.getByTestId(id).props.onPress(); });

describe('OnboardingTourContext', () => {
  it('starts with tourStep null', () => {
    const utils = renderTour();
    expect(getStep(utils)).toBe('idle');
  });

  it('startOnboardingTour sets step to tap_quick_setup', () => {
    const utils = renderTour();
    press(utils, 'startOnboarding');
    expect(getStep(utils)).toBe('tap_quick_setup');
  });

  it('startRoomsFromDashboardTour sets step to tap_rooms', () => {
    const utils = renderTour();
    press(utils, 'startRooms');
    expect(getStep(utils)).toBe('tap_rooms');
  });

  it('startRoomTour sets step to tap_add_room', () => {
    const utils = renderTour();
    press(utils, 'startRoom');
    expect(getStep(utils)).toBe('tap_add_room');
  });

  it('startBedTour sets step to tap_room', () => {
    const utils = renderTour();
    press(utils, 'startBed');
    expect(getStep(utils)).toBe('tap_room');
  });

  it('startTenantTour sets step to tap_room_for_tenant', () => {
    const utils = renderTour();
    press(utils, 'startTenant');
    expect(getStep(utils)).toBe('tap_room_for_tenant');
  });

  it('startRentTour sets step to tap_tenant', () => {
    const utils = renderTour();
    press(utils, 'startRent');
    expect(getStep(utils)).toBe('tap_tenant');
  });

  describe('advanceTour', () => {
    it('tap_quick_setup → null', () => {
      const utils = renderTour();
      press(utils, 'startOnboarding');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('idle');
    });

    it('tap_rooms → tap_room_for_tenant', () => {
      const utils = renderTour();
      press(utils, 'startRooms');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_room_for_tenant');
    });

    it('tap_add_room → tap_room', () => {
      const utils = renderTour();
      press(utils, 'startRoom');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_room');
    });

    it('tap_room → tap_add_bed', () => {
      const utils = renderTour();
      press(utils, 'startBed');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_add_bed');
    });

    it('tap_add_bed → tap_add_tenant', () => {
      const utils = renderTour();
      press(utils, 'startBed');
      press(utils, 'advance');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_add_tenant');
    });

    it('tap_room_for_tenant → tap_add_tenant', () => {
      const utils = renderTour();
      press(utils, 'startTenant');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_add_tenant');
    });

    it('tap_add_tenant → tap_add_rent', () => {
      const utils = renderTour();
      press(utils, 'startTenant');
      press(utils, 'advance');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_add_rent');
    });

    it('tap_tenant → tap_add_rent', () => {
      const utils = renderTour();
      press(utils, 'startRent');
      press(utils, 'advance');
      expect(getStep(utils)).toBe('tap_add_rent');
    });

    it('null → null (no crash)', () => {
      const utils = renderTour();
      press(utils, 'advance');
      expect(getStep(utils)).toBe('idle');
    });
  });

  describe('endTour', () => {
    it('sets tourStep to null', () => {
      const utils = renderTour();
      press(utils, 'startOnboarding');
      press(utils, 'end');
      expect(getStep(utils)).toBe('idle');
    });
  });

  it('useOnboardingTour returns default values outside provider', () => {
    const DefaultConsumer = () => {
      const ctx = useOnboardingTour();
      return <Text>{ctx.tourStep ?? 'default'}</Text>;
    };
    const { getByText } = render(<DefaultConsumer />);
    expect(getByText('default')).toBeTruthy();
  });
});
