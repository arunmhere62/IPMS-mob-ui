export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'dashboard_view',

  // PG Locations
  VIEW_PG_LOCATIONS = 'pg_location_view',
  CREATE_PG_LOCATION = 'pg_location_create',
  EDIT_PG_LOCATION = 'pg_location_edit',
  DELETE_PG_LOCATION = 'pg_location_delete',

  // Tenants
  VIEW_TENANTS = 'tenant_view',
  CREATE_TENANT = 'tenant_create',
  EDIT_TENANT = 'tenant_edit',
  DELETE_TENANT = 'tenant_delete',

  // Payments
  VIEW_PAYMENTS = 'rent_view',
  CREATE_PAYMENT = 'rent_create',
  EDIT_PAYMENT = 'rent_edit',
  DELETE_PAYMENT = 'rent_delete',
  APPROVE_PAYMENT = 'rent_approve',

  // Room
  VIEW_ROOM = 'room_view',
  CREATE_ROOM = 'room_create',
  EDIT_ROOM = 'room_edit',
  DELETE_ROOM = 'room_delete',

  // Visitors
  VIEW_VISITOR = 'visitor_view',
  CREATE_VISITOR = 'visitor_create',
  EDIT_VISITOR = 'visitor_edit',
  DELETE_VISITOR = 'visitor_delete',

  // Employee Salary
  VIEW_EMPLOYEE_SALARY = 'employee_salary_view',
  CREATE_EMPLOYEE_SALARY = 'employee_salary_create',
  EDIT_EMPLOYEE_SALARY = 'employee_salary_edit',
  DELETE_EMPLOYEE_SALARY = 'employee_salary_delete',


  // Expenses
  VIEW_EXPENSES = 'expense_view',
  CREATE_EXPENSE = 'expense_create',
  EDIT_EXPENSE = 'expense_edit',
  DELETE_EXPENSE = 'expense_delete',

  // Bed
  VIEW_BED = 'bed_view',
  CREATE_BED = 'bed_create',
  EDIT_BED = 'bed_edit',
  DELETE_BED = 'bed_delete',


  // Employees
  VIEW_EMPLOYEE = 'employee_view',
  CREATE_EMPLOYEE = 'employee_create',
  EDIT_EMPLOYEE = 'employee_edit',
  DELETE_EMPLOYEE = 'employee_delete',


  // Rent
  VIEW_RENT = 'rent_view',
  CREATE_RENT = 'rent_create',
  EDIT_RENT = 'rent_edit',
  DELETE_RENT = 'rent_delete',

  // Advance
  VIEW_ADVANCE = 'advance_view',
  CREATE_ADVANCE = 'advance_create',
  EDIT_ADVANCE = 'advance_edit',
  DELETE_ADVANCE = 'advance_delete',

  // Refund
  VIEW_REFUND = 'refund_view',
  CREATE_REFUND = 'refund_create',
  EDIT_REFUND = 'refund_edit',
  DELETE_REFUND = 'refund_delete',


  // Reports
  VIEW_REPORTS = 'report_view',
  EXPORT_REPORTS = 'report_export',

  // Settings
  VIEW_SETTINGS = 'settings_view',
  EDIT_SETTINGS = 'settings_edit',

}
