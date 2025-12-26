import { Permission } from './rbac.config';

const singularize = (s: string) => {
  if (s.endsWith('ies')) return `${s.slice(0, -3)}y`;
  if (s.endsWith('s') && s.length > 1) return s.slice(0, -1);
  return s;
};

const explicitMap: Partial<Record<Permission, string>> = {
  [Permission.VIEW_TENANTS]: 'tenant_view',
  [Permission.CREATE_TENANT]: 'tenant_create',
  [Permission.EDIT_TENANT]: 'tenant_edit',
  [Permission.DELETE_TENANT]: 'tenant_delete',

  // Backend currently uses rent_* keys for payments in the sample
  [Permission.VIEW_PAYMENTS]: 'rent_view',
  [Permission.CREATE_PAYMENT]: 'rent_create',
  [Permission.EDIT_PAYMENT]: 'rent_edit',
  [Permission.DELETE_PAYMENT]: 'rent_delete',
};

export const toBackendPermissionKey = (permission: Permission): string => {
  if (explicitMap[permission]) return explicitMap[permission] as string;

  const raw = String(permission);
  const idx = raw.indexOf('_');
  if (idx <= 0 || idx === raw.length - 1) {
    return raw;
  }

  const action = raw.slice(0, idx);
  const resource = raw.slice(idx + 1);

  return `${singularize(resource)}_${action}`;
};

export const getBackendPermissionKeyCandidates = (permission: Permission): string[] => {
  const raw = String(permission);
  const computed = toBackendPermissionKey(permission);

  // Also try the raw value (in case backend happens to use view_resource style)
  // and a singularized-raw (e.g. view_tenants -> view_tenant)
  const idx = raw.indexOf('_');
  const singularizedRaw = idx > 0 ? `${raw.slice(0, idx)}_${singularize(raw.slice(idx + 1))}` : raw;

  return Array.from(new Set([computed, raw, singularizedRaw]));
};
