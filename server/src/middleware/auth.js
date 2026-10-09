import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getTokenFromRequest(req) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice(7);
}

export async function protect(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    next(error);
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    next(error);
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      next(error);
      return;
    }

    req.user = user;
    next();
  } catch {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    next(error);
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    next(error);
    return;
  }

  next();
}