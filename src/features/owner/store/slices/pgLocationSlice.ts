import { createSlice } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';

interface PGLocationState {
  selectedPGLocationId: number | null;
  isRehydrated: boolean;
}

const initialState: PGLocationState = {
  selectedPGLocationId: null,
  isRehydrated: false,
};

const pgLocationSlice = createSlice({
  name: 'pgLocations',
  initialState,
  reducers: {
    setSelectedPGLocation: (state, action) => {
      state.selectedPGLocationId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state) => {
      state.isRehydrated = true;
    });
  },
});

export const { setSelectedPGLocation } = pgLocationSlice.actions;
export default pgLocationSlice.reducer;
