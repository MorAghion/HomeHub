/**
 * gmail-auth Edge Function
 *
 * Routes:
 *   GET /gmail-auth/authorize  — Build Google OAuth URL, redirect user
 *   GET /gmail-auth/callback   — Receive code, exchange tokens, encrypt, upsert, redirect
 *
 * Security:
 *   - Tokens encrypted with AES-256-GCM before storage
 *   - State parameter signed with HMAC-SHA256 to bind callback to user session
 *   - Service role key used only server-side for DB upsert
 *   - No tokens ever returned to the browser
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const OAUTH_ENCRYPTION_KEY = Deno.env.get('OAUTH_ENCRYPTION_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const REDIRECT_URI =
  'https://wwqvjiekakjetspucfxp.supabase.co/functions/v1/gmail-auth/callback';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const SUCCESS_REDIRECT = 'https://our-homehub.vercel.app/settings?gmail=connected';
const ERROR_REDIRECT = 'https://our-homehub.vercel.app/settings?gmail=error';

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

/** Derive a 256-bit CryptoKey from the OAUTH_ENCRYPTION_KEY secret. */
async function getDerivedKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(OAUTH_ENCRYPTION_KEY),
  );
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usage);
}

/** Encrypt plaintext → base64(iv + ciphertext). */
async function encrypt(plaintext: string): Promise<string> {
  const key = await getDerivedKey(['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt base64(iv + ciphertext) → plaintext. */
async function decrypt(encoded: string): Promise<string> {
  const key = await getDerivedKey(['decrypt']);
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

// ---------------------------------------------------------------------------
// HMAC-signed state helpers (CSRF protection)
// ---------------------------------------------------------------------------

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(OAUTH_ENCRYPTION_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function hmacSign(data: string): Promise<string> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * Create a signed state token encoding the userId.
 * Format: base64(payload).<hmac-signature>
 */
async function createState(userId: string): Promise<string> {
  const payload = btoa(JSON.stringify({ userId, nonce: crypto.randomUUID() }));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify the state token and return the userId, or null if invalid.
 */
async function verifyState(state: string): Promise<string | null> {
  const dotIdx = state.lastIndexOf('.');
  if (dotIdx === -1) return null;
  const payload = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);
  const expectedSig = await hmacSign(payload);
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(atob(payload));
    return typeof parsed.userId === 'string' ? parsed.userId : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

async function exchangeCode(code: string): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /gmail-auth/authorize
 *
 * Requires: Authorization: Bearer <supabase-jwt>
 * Redirects the authenticated user to Google's OAuth consent screen.
 */
async function handleAuthorize(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const jwt = authHeader.slice(7);

  // Verify JWT and extract user_id
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const state = await createState(user.id);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return Response.redirect(authUrl, 302);
}

/**
 * GET /gmail-auth/callback
 *
 * Receives the authorization code from Google, exchanges for tokens,
 * encrypts them, upserts into oauth_tokens, redirects to app.
 */
async function handleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    console.error('[gmail-auth] OAuth error from Google:', errorParam);
    return Response.redirect(`${ERROR_REDIRECT}&reason=${errorParam}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${ERROR_REDIRECT}&reason=missing_params`, 302);
  }

  // Verify state and extract userId
  const userId = await verifyState(state);
  if (!userId) {
    console.error('[gmail-auth] Invalid state parameter');
    return Response.redirect(`${ERROR_REDIRECT}&reason=invalid_state`, 302);
  }

  let tokens: GoogleTokenResponse;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error('[gmail-auth] Token exchange error:', err);
    return Response.redirect(`${ERROR_REDIRECT}&reason=token_exchange_failed`, 302);
  }

  if (!tokens.refresh_token) {
    // This happens when the user has previously granted access and prompt=consent was skipped.
    // We still have a valid access_token; store what we have.
    console.warn('[gmail-auth] No refresh_token returned — user may need to revoke and reconnect.');
  }

  // Encrypt tokens before storing
  const [encryptedAccess, encryptedRefresh] = await Promise.all([
    encrypt(tokens.access_token),
    encrypt(tokens.refresh_token ?? ''),
  ]);

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const scopes = tokens.scope ? tokens.scope.split(' ') : [GMAIL_SCOPE];

  // Use service role to bypass RLS — this is a server-side operation
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: upsertError } = await adminClient.from('oauth_tokens').upsert(
    {
      user_id: userId,
      provider: 'gmail',
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      expires_at: expiresAt,
      scopes,
    },
    { onConflict: 'user_id,provider' },
  );

  if (upsertError) {
    console.error('[gmail-auth] DB upsert error:', upsertError.message);
    return Response.redirect(`${ERROR_REDIRECT}&reason=db_error`, 302);
  }

  return Response.redirect(SUCCESS_REDIRECT, 302);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'GET' && path.endsWith('/authorize')) {
    return handleAuthorize(req);
  }

  if (req.method === 'GET' && path.endsWith('/callback')) {
    return handleCallback(req);
  }

  return new Response('Not Found', { status: 404 });
});
