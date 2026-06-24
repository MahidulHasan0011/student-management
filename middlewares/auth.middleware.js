import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, { message: 'Authorization token required', statusCode: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId, roleId, roleName }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, { message: 'Token expired', statusCode: 401 });
    }
    return errorResponse(res, { message: 'Invalid token', statusCode: 401 });
  }
};
