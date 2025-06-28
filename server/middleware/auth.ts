import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Session-based authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check if user is in session
  if (req.session && req.session.user && req.sessionID) {
    req.user = req.session.user;
    return next();
  }
  
  // Not authenticated - clear any stale session cookies
  res.clearCookie('sekondly.sid', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  });
  res.clearCookie('connect.sid', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  });
  
  res.status(401).json({ message: "Not authenticated" });
}

// Type declaration for the user property on Express Request and Session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        specialty?: string | null;
        isApproved?: boolean | null;
        isAdmin?: boolean | null;
        profileImageUrl?: string | null;
        phone?: string | null;
        medicalBoard?: string | null;
        fellowship?: string | null;
        experience?: string | null;
        institution?: string | null;
        createdAt?: Date | null;
        updatedAt?: Date | null;
        approvedAt?: Date | null;
        approvedBy?: string | null;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      specialty?: string | null;
      isApproved?: boolean | null;
      isAdmin?: boolean | null;
      profileImageUrl?: string | null;
      phone?: string | null;
      medicalBoard?: string | null;
      fellowship?: string | null;
      experience?: string | null;
      institution?: string | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
      approvedAt?: Date | null;
      approvedBy?: string | null;
    };
  }
}

// Admin-only middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}
