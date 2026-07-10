import { Permission } from '../rbac.config';

describe('rbac.config - Permission enum', () => {
  it('has PG Location permissions', () => {
    expect(Permission.VIEW_PG_LOCATIONS).toBe('pg_location_view');
    expect(Permission.CREATE_PG_LOCATION).toBe('pg_location_create');
    expect(Permission.EDIT_PG_LOCATION).toBe('pg_location_edit');
    expect(Permission.DELETE_PG_LOCATION).toBe('pg_location_delete');
  });

  it('has dashboard permission', () => {
    expect(Permission.VIEW_DASHBOARD).toBe('dashboard_view');
  });

  it('has tenant permissions', () => {
    expect(Permission.VIEW_TENANTS).toBe('tenant_view');
    expect(Permission.CREATE_TENANT).toBe('tenant_create');
    expect(Permission.EDIT_TENANT).toBe('tenant_edit');
    expect(Permission.DELETE_TENANT).toBe('tenant_delete');
  });

  it('has room permissions', () => {
    expect(Permission.VIEW_ROOM).toBe('room_view');
    expect(Permission.CREATE_ROOM).toBe('room_create');
    expect(Permission.EDIT_ROOM).toBe('room_edit');
    expect(Permission.DELETE_ROOM).toBe('room_delete');
  });

  it('has bed permissions', () => {
    expect(Permission.VIEW_BED).toBe('bed_view');
    expect(Permission.CREATE_BED).toBe('bed_create');
    expect(Permission.EDIT_BED).toBe('bed_edit');
    expect(Permission.DELETE_BED).toBe('bed_delete');
  });

  it('has payment permissions', () => {
    expect(Permission.VIEW_PAYMENT).toBe('payment_view');
    expect(Permission.CREATE_PAYMENT).toBe('payment_create');
    expect(Permission.EDIT_PAYMENT).toBe('payment_edit');
    expect(Permission.DELETE_PAYMENT).toBe('payment_delete');
  });

  it('has employee permissions', () => {
    expect(Permission.VIEW_EMPLOYEE).toBe('employee_view');
    expect(Permission.CREATE_EMPLOYEE).toBe('employee_create');
    expect(Permission.EDIT_EMPLOYEE).toBe('employee_edit');
    expect(Permission.DELETE_EMPLOYEE).toBe('employee_delete');
  });

  it('has ticket permissions', () => {
    expect(Permission.VIEW_TICKET).toBe('ticket_view');
    expect(Permission.CREATE_TICKET).toBe('ticket_create');
    expect(Permission.EDIT_TICKET).toBe('ticket_edit');
    expect(Permission.DELETE_TICKET).toBe('ticket_delete');
  });

  it('all permission values follow snake_case convention', () => {
    const values = Object.values(Permission);
    values.forEach(val => {
      expect(val).toMatch(/^[a-z]+_[a-z_]+$/);
    });
  });

  it('all permission values are unique', () => {
    const values = Object.values(Permission);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('has CRUD permissions for each resource', () => {
    const resources = ['pg_location', 'tenant', 'room', 'bed', 'payment', 'employee', 'ticket'];
    const actions = ['view', 'create', 'edit', 'delete'];

    resources.forEach(resource => {
      actions.forEach(action => {
        const expectedPerm = `${resource}_${action}`;
        const values = Object.values(Permission);
        expect(values).toContain(expectedPerm);
      });
    });
  });
});
