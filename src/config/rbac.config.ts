export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  
  // PG Locations
  VIEW_PG_LOCATIONS = 'view_pg_locations',
  CREATE_PG_LOCATION = 'create_pg_location',
  EDIT_PG_LOCATION = 'edit_pg_location',
  DELETE_PG_LOCATION = 'delete_pg_location',
  
  // Tenants
  VIEW_TENANTS = 'view_tenants',
  CREATE_TENANT = 'create_tenant',
  EDIT_TENANT = 'edit_tenant',
  DELETE_TENANT = 'delete_tenant',
  
  // Payments
  VIEW_PAYMENTS = 'view_payments',
  CREATE_PAYMENT = 'create_payment',
  EDIT_PAYMENT = 'edit_payment',
  DELETE_PAYMENT = 'delete_payment',
  APPROVE_PAYMENT = 'approve_payment',
  
  // Rooms & Beds
  VIEW_ROOMS = 'view_rooms',
  CREATE_ROOM = 'create_room',
  EDIT_ROOM = 'edit_room',
  DELETE_ROOM = 'delete_room',
  
  // Expenses
  VIEW_EXPENSES = 'view_expenses',
  CREATE_EXPENSE = 'create_expense',
  EDIT_EXPENSE = 'edit_expense',
  DELETE_EXPENSE = 'delete_expense',
  
  // Users & Employees
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  
  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Settings
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',
  
  // Organization Management (SuperAdmin only)
  VIEW_ALL_ORGANIZATIONS = 'view_all_organizations',
  MANAGE_ORGANIZATIONS = 'manage_organizations',
}
