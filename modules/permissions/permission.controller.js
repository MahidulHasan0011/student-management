const service = require("./permission.service");
const sendResponse = require("../../utils/response");

const createPermission = async (req, res, next) => {
  try {
    const data = await service.createPermission(req.body);

    return sendResponse(
      res,
      201,
      "Permission created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const result = await service.getPermissions( req.query );

    return sendResponse(
      res,
      200,
      result.message,
      {
        data: result.data,
        meta: result.meta,
        pagination: result.pagination
      }
    );
  } catch (err) {
    next(err);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const data = await service.updatePermission(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Permission not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Permission updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    const data = await service.deletePermission(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Permission not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Permission deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission
}
 