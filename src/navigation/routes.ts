/**
 * Navigation Routes Configuration
 *
 * Centralized route definitions for the application.
 * Organized by feature areas: Auth, Owner, Tenant.
 */

// ==================== AUTH ROUTES ====================
export const AUTH_ROUTES = {
  ROLE_SELECTION: 'RoleSelection',
  LOGIN: 'Login',
  TENANT_LOGIN: 'TenantLogin',
  SIGNUP: 'Signup',
  SIGNUP_OTP: 'SignupOtp',
  OTP_VERIFICATION: 'OTPVerification',
  TENANT_OTP_VERIFICATION: 'TenantOTPVerification',
  LEGAL_DOCUMENTS: 'LegalDocuments',
  LEGAL_WEBVIEW: 'LegalWebView',
} as const;

// ==================== OWNER ROUTES ====================
export const OWNER_ROUTES = {
  // Main Tabs
  MAIN_TABS: 'MainTabs',

  // Dashboard
  DASHBOARD: 'Dashboard',

  // Tenants
  TENANTS: 'Tenants',
  TENANT_DETAILS: 'TenantDetails',
  ADD_TENANT: 'AddTenant',
  TENANT_RENT_PAYMENTS: 'TenantRentPaymentsScreen',
  TENANT_ADVANCE_PAYMENTS: 'TenantAdvancePaymentsScreen',
  TENANT_REFUND_PAYMENTS: 'TenantRefundPaymentsScreen',

  // Rooms & Beds
  ROOMS: 'Rooms',
  ROOM_DETAILS: 'RoomDetails',
  ROOM_ELECTRICITY_BILLS: 'RoomElectricityBills',
  BEDS: 'Beds',

  // Payments
  PAYMENTS: 'Payments',
  RENT_PAYMENTS: 'RentPayments',
  ADVANCE_PAYMENTS: 'AdvancePayments',
  REFUND_PAYMENTS: 'RefundPayments',

  // PG Locations
  PG_LOCATIONS: 'PGLocations',
  PG_DETAILS: 'PGDetails',

  // Organizations
  ORGANIZATIONS: 'Organizations',

  // Expenses
  EXPENSES: 'Expenses',

  // Employees
  EMPLOYEES: 'Employees',
  ADD_EMPLOYEE: 'AddEmployee',
  EMPLOYEE_DETAILS: 'EmployeeDetails',
  EMPLOYEE_PERMISSION_OVERRIDES: 'EmployeePermissionOverrides',

  // Visitors
  VISITORS: 'Visitors',
  ADD_VISITOR: 'AddVisitor',
  VISITOR_DETAILS: 'VisitorDetails',

  // Tickets
  TICKETS: 'Tickets',
  CREATE_TICKET: 'CreateTicket',
  TICKET_DETAILS: 'TicketDetails',

  // PG Tenant Tickets (Owner viewing tenant tickets)
  PG_TENANT_TICKETS: 'PgTenantTickets',
  PG_TENANT_TICKET_DETAIL: 'PgTenantTicketDetail',

  // Settings & Profile
  SETTINGS: 'Settings',
  USER_PROFILE: 'UserProfile',
  FAQ_WEBVIEW: 'FaqWebView',

  // Subscription
  SUBSCRIPTION_PLANS: 'SubscriptionPlans',
  SUBSCRIPTION_HISTORY: 'SubscriptionHistory',
  SUBSCRIPTION_CONFIRM: 'SubscriptionConfirm',
  PAYMENT_OPTIONS: 'PaymentOptions',
  PAYMENT_WEBVIEW: 'PaymentWebView',

  // Legal
  LEGAL_DOCUMENTS: 'LegalDocuments',
  LEGAL_WEBVIEW: 'LegalWebView',

  // Dev Tools
  NETWORK_LOGGER: 'NetworkLogger',
} as const;

// ==================== TENANT ROUTES ====================
export const TENANT_ROUTES = {
  DASHBOARD: 'TenantDashboard',
  TICKETS: 'TenantTickets',
  CREATE_TICKET: 'TenantCreateTicket',
  TICKET_DETAIL: 'TenantTicketDetail',
} as const;

// ==================== ROUTE GROUPS ====================
export const ROUTE_GROUPS = {
  AUTH: Object.values(AUTH_ROUTES),
  OWNER: Object.values(OWNER_ROUTES),
  TENANT: Object.values(TENANT_ROUTES),
};

// ==================== TAB SCREENS (Owner Bottom Nav) ====================
export const TAB_SCREENS = [
  OWNER_ROUTES.DASHBOARD,
  OWNER_ROUTES.TENANTS,
  OWNER_ROUTES.PAYMENTS,
  OWNER_ROUTES.SETTINGS,
] as const;

// ==================== ROUTE TYPE EXPORTS ====================
export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
export type OwnerRoute = typeof OWNER_ROUTES[keyof typeof OWNER_ROUTES];
export type TenantRoute = typeof TENANT_ROUTES[keyof typeof TENANT_ROUTES];
