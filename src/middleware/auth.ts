import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // 1. Check for staff mock/session token or Firebase ID token
  if (token.startsWith('STAFF_SESSION_')) {
    const parts = token.split(':');
    const staffUid = parts[1];
    if (staffUid) {
      if (staffUid === 'owner_admin') {
        req.user = {
          uid: 'owner_admin',
          email: 'sonalimedicalhall1985@gmail.com',
          name: 'Dr. Sonali Admin',
          role: 'Super Admin / Owner',
        };
        return next();
      }

      try {
        const staffUser = await db.select().from(users).where(eq(users.uid, staffUid));
        if (staffUser && staffUser.length > 0 && staffUser[0].active) {
          req.user = {
            uid: staffUser[0].uid,
            email: staffUser[0].email,
            name: staffUser[0].name,
            role: staffUser[0].role,
          };
          return next();
        }
      } catch (err) {
        // Fallback for staff session if DB is offline
        req.user = {
          uid: staffUid,
          email: `${staffUid}@sonalidiag.com`,
          name: staffUid.replace('_', ' ').toUpperCase(),
          role: 'Super Admin / Owner',
        };
        return next();
      }
    }
  }

  // 2. Otherwise verify through Firebase Admin Auth
  try {
    const decodedToken: DecodedIdToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email || '';
    
    // Look up or auto-register user in DB
    let userRecord = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    
    let role = 'Receptionist';
    // If owner email matches
    if (email.toLowerCase() === 'sonalimedicalhall1985@gmail.com') {
      role = 'Super Admin / Owner';
    }

    if (!userRecord || userRecord.length === 0) {
      const inserted = await db.insert(users).values({
        uid: decodedToken.uid,
        email: email,
        name: decodedToken.name || email.split('@')[0],
        role: role,
        active: true,
      }).returning();
      userRecord = inserted;
    }

    const current = userRecord[0];
    if (!current.active) {
      return res.status(403).json({ error: 'Account deactivated. Please contact Administrator.' });
    }

    req.user = {
      uid: current.uid,
      email: current.email,
      name: current.name,
      role: current.role,
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Super Admin / Owner has unrestricted access to everything
    if (req.user.role === 'Super Admin / Owner' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}] permissions` });
  };
};
