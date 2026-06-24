// work Flow

// rbacMiddleware
//     ↓
// roleService.getCachedPermissions()
//     ↓
// permissionEngine.resolvePermissions()
//     ↓
// Redis Cache
//     ↓
// roleRepository.getPermissionNames()

import { roleService } from '../modules/roles/role.service.js';
import { errorResponse } from '../utils/response.js';

export const rbacMiddleware = (requiredPermissions) => {
  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      if (!req.user?.roleId) {
        return errorResponse(res, { message: 'Unauthorized', statusCode: 401 });
      }

      const userPerms = await roleService.getCachedPermissions(req.user.roleId);
      const hasPermission = perms.some((p) => userPerms.includes(p));

      if (!hasPermission) {
        return errorResponse(res, {
          message: `Access denied. Required: ${perms.join(' or ')}`,
          statusCode: 403,
        });
      }

      req.permissions = userPerms;
      next();
    } catch (err) {
      next(err);
    }
  };
};
