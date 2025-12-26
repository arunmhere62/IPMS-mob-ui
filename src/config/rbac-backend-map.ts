import { Permission } from './rbac.config';

export const toBackendPermissionKey = (permission: Permission): string => {
  return String(permission);
};

export const getBackendPermissionKeyCandidates = (permission: Permission): string[] => {
  return [toBackendPermissionKey(permission)];
};
