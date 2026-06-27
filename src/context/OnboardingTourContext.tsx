import React, { createContext, useContext, useState, useCallback } from 'react';

export type TourStep =
  | 'tap_add_room'      // On Rooms screen: tap FAB + to add a room
  | 'tap_room'          // On Rooms screen: tap a room to open details
  | 'tap_add_bed'       // On RoomDetails screen: tap + to add bed
  | 'tap_add_tenant'    // On Beds screen: tap Add Tenant on an available bed
  | 'tap_tenant'        // On Tenants screen: tap a tenant card to open details
  | 'tap_add_rent'      // On TenantDetails screen: tap Add Rent button
  | null;               // No active tour

interface OnboardingTourContextValue {
  tourStep: TourStep;
  startRoomTour: () => void;
  startBedTour: () => void;
  startTenantTour: () => void;
  startRentTour: () => void;
  advanceTour: () => void;
  endTour: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue>({
  tourStep: null,
  startRoomTour: () => {},
  startBedTour: () => {},
  startTenantTour: () => {},
  startRentTour: () => {},
  advanceTour: () => {},
  endTour: () => {},
});

export const OnboardingTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tourStep, setTourStep] = useState<TourStep>(null);

  const startRoomTour = useCallback(() => {
    setTourStep('tap_add_room');
  }, []);

  const startBedTour = useCallback(() => {
    setTourStep('tap_room');
  }, []);

  const startTenantTour = useCallback(() => {
    setTourStep('tap_add_tenant');
  }, []);

  const startRentTour = useCallback(() => {
    setTourStep('tap_tenant');
  }, []);

  const advanceTour = useCallback(() => {
    setTourStep((prev) => {
      if (prev === 'tap_add_room') return null; // room created, tour done for this step
      if (prev === 'tap_room') return 'tap_add_bed';
      if (prev === 'tap_tenant') return 'tap_add_rent';
      return null;
    });
  }, []);

  const endTour = useCallback(() => {
    setTourStep(null);
  }, []);

  return (
    <OnboardingTourContext.Provider value={{ tourStep, startRoomTour, startBedTour, startTenantTour, startRentTour, advanceTour, endTour }}>
      {children}
    </OnboardingTourContext.Provider>
  );
};

export const useOnboardingTour = () => useContext(OnboardingTourContext);
