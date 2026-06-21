import { authService } from "./auth.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return errorResponse(res, { message: "Email and password are required", statusCode: 400 });
      }
      const data = await authService.login({ email, password });
      return successResponse(res, { message: "Login successful", data });
    } catch (err) { next(err); }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const data = await authService.refresh(refreshToken);
      return successResponse(res, { message: "Token refreshed", data });
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.userId);
      return successResponse(res, { message: "Logged out successfully" });
    } catch (err) { next(err); }
  },

  async me(req, res, next) {
    try {
      const data = await authService.getMe(req.user.userId);
      return successResponse(res, { message: "User fetched", data });
    } catch (err) { next(err); }
  },
};