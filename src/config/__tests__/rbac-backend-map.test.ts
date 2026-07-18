import { toBackendPermissionKey, getBackendPermissionKeyCandidates } from '../rbac-backend-map';
import { Permission } from '../rbac.config';

describe('rbac-backend-map', () => {
  describe('toBackendPermissionKey', () => {
    it('converts permission enum to string', () => {
      expect(toBackendPermissionKey(Permission.VIEW_TENANTS)).toBe('tenant_view');
      expect(toBackendPermissionKey(Permission.CREATE_TENANT)).toBe('tenant_create');
      expect(toBackendPermissionKey(Permission.EDIT_TENANT)).toBe('tenant_edit');
      expect(toBackendPermissionKey(Permission.DELETE_TENANT)).toBe('tenant_delete');
    });

    it('converts all permission types correctly', () => {
      expect(toBackendPermissionKey(Permission.VIEW_PG_LOCATIONS)).toBe('pg_location_view');
      expect(toBackendPermissionKey(Permission.CREATE_PG_LOCATION)).toBe('pg_location_create');
      expect(toBackendPermissionKey(Permission.EDIT_PG_LOCATION)).toBe('pg_location_edit');
      expect(toBackendPermissionKey(Permission.DELETE_PG_LOCATION)).toBe('pg_location_delete');
      expect(toBackendPermissionKey(Permission.VIEW_DASHBOARD)).toBe('dashboard_view');
      expect(toBackendPermissionKey(Permission.VIEW_ROOM)).toBe('room_view');
      expect(toBackendPermissionKey(Permission.CREATE_ROOM)).toBe('room_create');
      expect(toBackendPermissionKey(Permission.EDIT_ROOM)).toBe('room_edit');
      expect(toBackendPermissionKey(Permission.DELETE_ROOM)).toBe('room_delete');
      expect(toBackendPermissionKey(Permission.VIEW_BED)).toBe('bed_view');
      expect(toBackendPermissionKey(Permission.CREATE_BED)).toBe('bed_create');
      expect(toBackendPermissionKey(Permission.EDIT_BED)).toBe('bed_edit');
      expect(toBackendPermissionKey(Permission.DELETE_BED)).toBe('bed_delete');
      expect(toBackendPermissionKey(Permission.VIEW_PAYMENT)).toBe('payment_view');
      expect(toBackendPermissionKey(Permission.CREATE_PAYMENT)).toBe('payment_create');
      expect(toBackendPermissionKey(Permission.EDIT_PAYMENT)).toBe('payment_edit');
      expect(toBackendPermissionKey(Permission.DELETE_PAYMENT)).toBe('payment_delete');
      expect(toBackendPermissionKey(Permission.VIEW_EMPLOYEE)).toBe('employee_view');
      expect(toBackendPermissionKey(Permission.CREATE_EMPLOYEE)).toBe('employee_create');
      expect(toBackendPermissionKey(Permission.EDIT_EMPLOYEE)).toBe('employee_edit');
      expect(toBackendPermissionKey(Permission.DELETE_EMPLOYEE)).toBe('employee_delete');
      expect(toBackendPermissionKey(Permission.VIEW_TICKET)).toBe('ticket_view');
      expect(toBackendPermissionKey(Permission.CREATE_TICKET)).toBe('ticket_create');
      expect(toBackendPermissionKey(Permission.EDIT_TICKET)).toBe('ticket_edit');
      expect(toBackendPermissionKey(Permission.DELETE_TICKET)).toBe('ticket_delete');
    });

    it('returns string type', () => {
      const result = toBackendPermissionKey(Permission.VIEW_TENANTS);
      expect(typeof result).toBe('string');
    });
  });

  describe('getBackendPermissionKeyCandidates', () => {
    it('returns array with single permission key', () => {
      const result = getBackendPermissionKeyCandidates(Permission.VIEW_TENANTS);
      expect(result).toEqual(['tenant_view']);
    });

    it('returns array for all permission types', () => {
      expect(getBackendPermissionKeyCandidates(Permission.CREATE_TENANT)).toEqual(['tenant_create']);
      expect(getBackendPermissionKeyCandidates(Permission.EDIT_TENANT)).toEqual(['tenant_edit']);
      expect(getBackendPermissionKeyCandidates(Permission.DELETE_TENANT)).toEqual(['tenant_delete']);
    });

    it('returns array type', () => {
      const result = getBackendPermissionKeyCandidates(Permission.VIEW_TENANTS);
      expect(Array.isArray(result)).toBe(true);
    });

    it('array contains strings', () => {
      const result = getBackendPermissionKeyCandidates(Permission.VIEW_TENANTS);
      result.forEach(item => {
        expect(typeof item).toBe('string');
      });
    });
  });
});
