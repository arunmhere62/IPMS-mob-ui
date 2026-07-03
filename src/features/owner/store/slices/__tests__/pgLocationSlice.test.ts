import pgLocationReducer, {
  setSelectedPGLocation,
} from '../pgLocationSlice';
import { REHYDRATE } from 'redux-persist';

describe('pgLocationSlice', () => {
  const initialState = {
    selectedPGLocationId: null,
    isRehydrated: false,
  };

  it('should return initial state', () => {
    expect(pgLocationReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setSelectedPGLocation', () => {
    it('sets selected PG location ID', () => {
      const action = setSelectedPGLocation(123);
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBe(123);
    });

    it('sets selected PG location ID to null', () => {
      const existingState = {
        selectedPGLocationId: 456,
        isRehydrated: false,
      };
      const action = setSelectedPGLocation(null);
      const state = pgLocationReducer(existingState, action);

      expect(state.selectedPGLocationId).toBeNull();
    });

    it('sets selected PG location ID to 0', () => {
      const action = setSelectedPGLocation(0);
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBe(0);
    });
  });

  describe('REHYDRATE', () => {
    it('rehydrates selectedPGLocationId from persisted state', () => {
      const action = {
        type: REHYDRATE,
        payload: {
          pgLocations: {
            selectedPGLocationId: 789,
          },
        },
      };
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBe(789);
      expect(state.isRehydrated).toBe(true);
    });

    it('does not rehydrate if persisted state is null', () => {
      const action = {
        type: REHYDRATE,
        payload: null,
      };
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBeNull();
      expect(state.isRehydrated).toBe(true);
    });

    it('does not rehydrate if pgLocations is null', () => {
      const action = {
        type: REHYDRATE,
        payload: {
          pgLocations: null,
        },
      };
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBeNull();
      expect(state.isRehydrated).toBe(true);
    });

    it('does not rehydrate if selectedPGLocationId is not a number', () => {
      const action = {
        type: REHYDRATE,
        payload: {
          pgLocations: {
            selectedPGLocationId: 'invalid' as any,
          },
        },
      };
      const state = pgLocationReducer(initialState, action);

      expect(state.selectedPGLocationId).toBeNull();
      expect(state.isRehydrated).toBe(true);
    });

    it('sets isRehydrated to true even without valid data', () => {
      const action = {
        type: REHYDRATE,
        payload: {},
      };
      const state = pgLocationReducer(initialState, action);

      expect(state.isRehydrated).toBe(true);
    });
  });
});
