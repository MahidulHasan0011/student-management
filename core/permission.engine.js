import { roleRepository } from "../modules/roles/role.repository.js";
import { cacheService } from "../services/cache.service.js";
import { TTL } from "../config/redis.js";

const PERM_CACHE_KEY = (roleId) => `role_permissions:${roleId}`;

// ── Core business logic — roleId থেকে permission নাম-এর লিস্ট বের করা ──
// rbac.middleware.js ও role.service.js এটা ব্যবহার করবে।
// cache-first: Redis-এ থাকলে DB ছোঁয় না, না থাকলে DB থেকে এনে cache করে রাখে
export const permissionEngine = {
  async resolvePermissions(roleId) {
    const cached = await cacheService.get(PERM_CACHE_KEY(roleId));
    if (cached) return cached;

    const permissions = await roleRepository.getPermissionNames(roleId);
    await cacheService.set(PERM_CACHE_KEY(roleId), permissions, TTL.PERMISSIONS);
    return permissions;
  },

  async invalidate(roleId) {
    await cacheService.del(PERM_CACHE_KEY(roleId));
  },

  // একসাথে একাধিক role-এর cache invalidate করতে (bulk permission update-এর পর)
  async invalidateMany(roleIds) {
    await Promise.all(roleIds.map((id) => this.invalidate(id)));
  },
};