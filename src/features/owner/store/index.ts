import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import tenantAuthReducer from '../../tenant/store/tenantAuthSlice';
import pgLocationReducer from './slices/pgLocationSlice';
import organizationReducer from './slices/organizationSlice';
import rbacReducer from './slices/rbacSlice';
import appSettingsReducer from './slices/appSettingsSlice';
import { baseApi } from '../api/baseApi';
import { tenantBaseApi } from '../../tenant/api/tenantBaseApi';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'tenantAuth', 'pgLocations'], // Persist auth, tenant auth, and selected PG location
};

const rootReducer = combineReducers({
  auth: authReducer,
  tenantAuth: tenantAuthReducer,
  pgLocations: pgLocationReducer,
  organizations: organizationReducer,
  rbac: rbacReducer,
  appSettings: appSettingsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  [tenantBaseApi.reducerPath]: tenantBaseApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, tenantBaseApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
