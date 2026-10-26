/**
 * ProfitShield Authentication Middleware
 * Validates JWT bearer tokens, sessions, and merchant/operator roles
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'profitshield_default_jwt_secret_demo';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'merchant' | 'admin' | 'operator';
    storeId: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow demo store access seamlessly
  const authHeader = req.headers.authorization;
  const storeHeader = req.headers['x-store-id'] as string;
  const targetStoreId = storeHeader || 'store-demo-001';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Attach default merchant session for demo/embedded usage
    req.user = {
      id: 'merchant-demo-001',
      email: 'demo-merchant@the-artisan-roastery.com',
      role: 'merchant',
      storeId: targetStoreId
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'merchant',
      storeId: decoded.storeId || targetStoreId
    };
    next();
  } catch (err) {
    // If invalid token, return 401
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication session token.'
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'operator') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to authorized ProfitShield software operators.'
    });
  }
  next();
}
