import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import redisClient, { TTL } from "../../config/redis.js";

const REFRESH_KEY = (userId) => `refresh_token:${userId}`;

const signAccess = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });

const signRefresh = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });

export const authService = {
  async login({ email, password }) {
    const user = await authRepository.findByEmail(email.toLowerCase());
    if (!user) throw new AppError("Invalid email or password", 401);
    if (!user.is_active) throw new AppError("Account is deactivated", 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid email or password", 401);

    const tokenPayload = { userId: user.id, roleId: user.role_id, roleName: user.role_name };
    const accessToken = signAccess(tokenPayload);
    const refreshToken = signRefresh({ userId: user.id });

    await redisClient.setEx(REFRESH_KEY(user.id), TTL.REFRESH_TOKEN, refreshToken);

    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  },


  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError("Refresh token required", 401);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const stored = await redisClient.get(REFRESH_KEY(decoded.userId));

    // stored token-ই না থাকলে বা না মিললে — token reuse/theft সন্দেহ, পুরো session বাতিল করো
    if (!stored || stored !== refreshToken) {
      await redisClient.del(REFRESH_KEY(decoded.userId)); // safety: যদি কোনো token পড়েও থাকে, মুছে দাও
      throw new AppError("Refresh token is no longer valid — please log in again", 401);
    }

    const user = await authRepository.findById(decoded.userId);
    if (!user || !user.is_active) throw new AppError("User not found or deactivated", 401);

    const tokenPayload = { userId: user.id, roleId: user.role_id, roleName: user.role_name };

    // ── Rotation: নতুন access + নতুন refresh টোকেন, পুরনো refresh টোকেন বাতিল ──
    const accessToken = signAccess(tokenPayload);
    const newRefreshToken = signRefresh({ userId: user.id });

    await redisClient.setEx(REFRESH_KEY(user.id), TTL.REFRESH_TOKEN, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId) {
    await redisClient.del(REFRESH_KEY(userId));
  },

  async getMe(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },
};