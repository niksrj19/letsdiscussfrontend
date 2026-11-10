import { NextRequest, NextResponse } from 'next/server';
import type { AuthResponse, User } from '@/types/api';

const ACCESS_COOKIE = 'marketlens_access';
const REFRESH_COOKIE = 'marketlens_refresh';
const USER_COOKIE = 'marketlens_user';
const ACCESS_TTL = 30 * 60;
const REFRESH_TTL = 24 * 60 * 60;

type RouteContext = { params: Promise<{ path: string[] }> };

function backendUrl(path: string): string {
  const baseUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}/api/${path}`;
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function responseFromBackend(response: Response, payload: string | null) {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('Cache-Control', 'no-store');
  return new NextResponse(payload, { status: response.status, headers });
}

async function refreshTokens(refreshToken: string): Promise<AuthResponse | null> {
  const response = await fetch(backendUrl('auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json() as Promise<AuthResponse>;
}

function setTokenCookies(response: NextResponse, tokens: AuthResponse) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn || ACCESS_TTL));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshExpiresIn || REFRESH_TTL));
  response.cookies.set(USER_COOKIE, JSON.stringify(tokens.user), cookieOptions(tokens.refreshExpiresIn || REFRESH_TTL));
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(0), expires: new Date(0) });
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(0), expires: new Date(0) });
  response.cookies.set(USER_COOKIE, '', { ...cookieOptions(0), expires: new Date(0) });
}

function cookieUser(request: NextRequest): User | null {
  try {
    const value = request.cookies.get(USER_COOKIE)?.value;
    if (!value) return null;
    try { return JSON.parse(value) as User; }
    catch { return JSON.parse(decodeURIComponent(value)) as User; }
  } catch { return null; }
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path: segments } = await context.params;
  const path = segments.map(encodeURIComponent).join('/');
  const isGoogleLogin = path === 'auth/google' && request.method === 'POST';
  const isRefresh = path === 'auth/refresh' && request.method === 'POST';
  const isLogout = path === 'auth/logout' && request.method === 'POST';
  const isSession = path === 'auth/session' && request.method === 'GET';

  if (isSession) {
    const hasTokens = Boolean(request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value);
    return NextResponse.json({ user: hasTokens ? cookieUser(request) : null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (isGoogleLogin) {
    const body = await request.text();
    const result = await fetch(backendUrl(path), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body, cache: 'no-store',
    });
    const payload = await result.text();
    if (!result.ok) return responseFromBackend(result, payload);

    const tokens = JSON.parse(payload) as AuthResponse;
    const response = NextResponse.json({ user: tokens.user }, { headers: { 'Cache-Control': 'no-store' } });
    setTokenCookies(response, tokens);
    return response;
  }

  if (isRefresh) {
    const currentRefreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!currentRefreshToken) {
      const response = errorResponse('Session expired. Please sign in again.', 401);
      clearAuthCookies(response);
      return response;
    }
    let tokens: AuthResponse | null;
    try { tokens = await refreshTokens(currentRefreshToken); }
    catch {
      const response = errorResponse('The backend API is unavailable.', 502);
      clearAuthCookies(response);
      return response;
    }
    if (!tokens) {
      const response = errorResponse('Session expired. Please sign in again.', 401);
      clearAuthCookies(response);
      return response;
    }
    const response = NextResponse.json({ refreshed: true }, { headers: { 'Cache-Control': 'no-store' } });
    setTokenCookies(response, tokens);
    return response;
  }

  let currentAccessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const currentRefreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let rotatedTokens: AuthResponse | null = null;
  if (isLogout && !currentAccessToken && currentRefreshToken) {
    try { rotatedTokens = await refreshTokens(currentRefreshToken); }
    catch { rotatedTokens = null; }
    currentAccessToken = rotatedTokens?.accessToken;
  }
  if (!currentAccessToken) {
    const response = errorResponse('Authentication required.', 401);
    if (isLogout || !currentRefreshToken) clearAuthCookies(response);
    return response;
  }

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
  const sendToBackend = (accessToken: string) => fetch(backendUrl(path), {
    method: request.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(request.headers.get('content-type') ? { 'Content-Type': request.headers.get('content-type')! } : {}),
    },
    ...(body && body.byteLength > 0 ? { body } : {}),
    cache: 'no-store',
  });

  let result: Response;
  try { result = await sendToBackend(currentAccessToken); }
  catch {
    const response = errorResponse('The backend API is unavailable.', 502);
    if (isLogout) clearAuthCookies(response);
    return response;
  }

  if (result.status === 401 && isLogout && currentRefreshToken && !rotatedTokens) {
    try {
      rotatedTokens = await refreshTokens(currentRefreshToken);
      if (rotatedTokens) result = await sendToBackend(rotatedTokens.accessToken);
    } catch { rotatedTokens = null; }
  }

  const payload = await result.text();
  const response = responseFromBackend(result, payload);
  if (rotatedTokens) setTokenCookies(response, rotatedTokens);

  if (isLogout) clearAuthCookies(response);
  return response;
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
