import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { getCookie } from './cookies';
import { IJWT, TRole, TUserResult } from '@/types/types';
import { redirect } from 'next/navigation';
import { isAuthFallbackEnabled, logFallback } from './runtime-fallbacks';

function getJwtSecret() {
  if (isAuthFallbackEnabled) {
    // FALLBACK(no-db): Auth stays disabled until the real monorepo secrets are
    // configured. Returning null keeps admin routes redirecting to login safely.
    logFallback('auth', 'JWT_SECRET is missing, treating auth as unavailable.');
    return null;
  }

  return new TextEncoder().encode(process.env.JWT_SECRET);
}

const createJWT = async (payload: IJWT & JWTPayload): Promise<string> => {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('FALLBACK_AUTH_DISABLED');
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
};

const verifyJWT = async (token: string): Promise<IJWT & JWTPayload> => {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('FALLBACK_AUTH_DISABLED');
  }

  const { payload } = await jwtVerify(token, secret);
  if (typeof payload.id === 'string' && typeof payload.role === 'string') {
    return payload as IJWT & JWTPayload;
  }
  throw new Error('Invalid JWT payload');
};

const verifyRole = async (requiredRole: TRole): Promise<boolean> => {
  try {
    const token = await getCookie('token');
    if (!token) return false;
    const decodedToken = (await verifyJWT(token)) as IJWT;
    return decodedToken.role === requiredRole;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getCurrentUser = async (): Promise<TUserResult> => {
  try {
    const token = await getCookie('token');
    if (!token) return { error: 'no-token' };
    const user = await verifyJWT(token);
    return { user };
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid JWT payload') {
      return { error: 'invalid-token' };
    }
    if (err instanceof Error && err.message === 'FALLBACK_AUTH_DISABLED') {
      return { error: 'no-token' };
    }
    console.error('getCurrentUser failed:', err);
    return { error: 'server-error' };
  }
};

const authGuard = async (): Promise<IJWT & JWTPayload> => {
  const result = await getCurrentUser();
  if ('error' in result) {
    redirect('/admin/login');
  }
  return result.user;
};

const multiRoleGuard = async (
  allowedRoles: TRole[],
): Promise<IJWT & JWTPayload> => {
  const result = await getCurrentUser();
  if ('error' in result) {
    redirect('/admin/login');
  }

  if (!allowedRoles.includes(result.user.role)) {
    redirect('/admin/login');
  }

  return result.user;
};

const logoutUser = async () => {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    return res;
  } catch (error) {
    console.error(error);
  }
};

export {
  createJWT,
  verifyJWT,
  verifyRole,
  getCurrentUser,
  authGuard,
  multiRoleGuard,
  logoutUser,
};
