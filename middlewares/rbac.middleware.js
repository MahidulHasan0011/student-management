const { roleService } = require("../modules/roles/role.service");
const { errorResponse } = require("../utils/response");

// Usage: rbacMiddleware("STUDENT_CREATE")
// Usage: rbacMiddleware(["STUDENT_CREATE", "STUDENT_UPDATE"])


const rbacMiddleware  = (requiredPermissions) => {
    const perms = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];

    return async (req, res, next) => {
        try {
          if (!req.user?.roleId) {
            return errorResponse(res, { message: "Unauthorized", statusCode: 401 });
          }

          const userPerms = await roleService.getCachedPermissions(req.user.roleId);
          const hasPermission = perms.some((p) => userPerms.includes(p));

            if (!hasPermission) {
              return errorResponse(res, {
                message: `Access denied. Required: ${perms.join(" or ")}`,
                statusCode: 403,
             });

            }
            req.permissions = userPerms;
            next();
        } catch (error) {
            next(error);

        };
    };
};

export default { rbacMiddleware };