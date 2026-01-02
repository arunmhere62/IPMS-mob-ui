import { ENV } from './environment';

export const API_CONFIG = {
  // Uses centralized environment configuration
  BASE_URL: ENV.API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
  },
  TENANTS: {
    LIST: '/tenants',
    CREATE: '/tenants',
    UPDATE: (id: number) => `/tenants/${id}`,
    DELETE: (id: number) => `/tenants/${id}`,
    DETAILS: (id: number) => `/tenants/${id}`,
  },
  PG_LOCATIONS: {
    BASE: '/pg-locations',
    LIST: '/pg-locations',
    CREATE: '/pg-locations',
    UPDATE: (id: number) => `/pg-locations/${id}`,
    DELETE: (id: number) => `/pg-locations/${id}`,
    DETAILS: (id: number) => `/pg-locations/${id}/details`,
  },
  ROOMS: {
    LIST: '/rooms',
    CREATE: '/rooms',
    UPDATE: (id: number) => `/rooms/${id}`,
    DELETE: (id: number) => `/rooms/${id}`,
  },
  BEDS: {
    LIST: '/beds',
    CREATE: '/beds',
    UPDATE: (id: number) => `/beds/${id}`,
    DELETE: (id: number) => `/beds/${id}`,
  },
  PAYMENTS: {
    rent_payments: '/rent-payments',
    ADVANCE_PAYMENTS: '/advance-payments',
    REFUND_PAYMENTS: '/refund-payments',
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
  },
  VISITORS: {
    LIST: '/visitors',
    CREATE: '/visitors',
  },
};
