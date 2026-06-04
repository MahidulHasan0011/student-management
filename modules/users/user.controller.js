const service = require("./user.service");
const sendResponse = require("../../utils/response");

const createUser = async (req, res, next) => {
  try {
    const data = await service.createUser(req.body);

    return sendResponse(
      res,
      201,
      "User created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const data = await service.getUsers(req.query);

    return sendResponse(
      res,
      200,
      "Users fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const data = await service.updateUser(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "User not found"
      );
    }

    return sendResponse(
      res,
      200,
      "User updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const data = await service.deleteUser(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "User not found"
      );
    }

    return sendResponse(
      res,
      200,
      "User deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
}
 