import { createSlice } from '@reduxjs/toolkit';

interface PGLocationState {
  selectedPGLocationId: number | null;
}

const initialState: PGLocationState = {
  selectedPGLocationId: null,
};

const pgLocationSlice = createSlice({
  name: 'pgLocations',
  initialState,
  reducers: {
    setSelectedPGLocation: (state, action) => {
      state.selectedPGLocationId = action.payload;
    },
  },
});

export const { setSelectedPGLocation } = pgLocationSlice.actions;
export default pgLocationSlice.reducer;
