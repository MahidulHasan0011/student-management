const service = require("./role.service");
const sendResponse = require("../../utils/response");

const createRole = async (req, res, next) => {
  try {
    const data = await service.createRole(req.body);

    return sendResponse(
      res,
      201,
      "Role created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const data = await service.getRoles( req.query);

    return sendResponse(
      res,
      200,
      "Roles fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const data = await service.updateRole(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Role not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Role updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const data = await service.deleteRole(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Role not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Role deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
}
 