const service = require("./rolePermission.service");
const sendResponse = require("../../utils/response");

const assignRolePermission = async (req, res, next) => {
  try {
    const data = await service.assignRolePermission(req.body);

    return sendResponse(
      res,
      201,
      "Role permission assigned successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const data = await service.getRolePermissions();

    return sendResponse(
      res,
      200,
      "Role permissions fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateRolePermission = async (req, res, next) => {
  try {
    const data = await service.updateRolePermission(req.params.id, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        " Role permission not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Role permission updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteRolePermission = async (req, res, next) => {
  try {
    const data = await service.deleteRolePermission(req.params.id);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Role permission not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Role permission deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assignRolePermission,
  getRolePermissions,
  updateRolePermission,
  deleteRolePermission
}
 