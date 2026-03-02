/**
 * gmail-fetch Edge Function
 *
 * POST /gmail-fetch
 *
 * Authenticated endpoint: requires Authorization: Bearer <supabase-jwt>
 *
 * Flow:
 *   1. Verify JWT, extract user_id
 *   2. Fetch encrypted token row from oauth_tokens
 *   3. Decrypt access_token (and refresh_token if needed)
 *   4. If token is expired (within 5-min buffer), refresh via Google API
 *      and update oauth_tokens with new ciphertext
 *   5. Call Gmail API for inbox message list
 *   6. Fetch metadata for each message (sender, subject, date, has_attachments)
 *   7. Return JSON array of GmailMessage — never return raw tokens
 *
 * Rate limiting: respects maxResults=20 to stay within Google quotas.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const OAUTH_ENCRYPTION_KEY = Deno.env.get('OAUTH_ENCRYPTION_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  hasAttachments: boolean;
}

interface OAuthTokenRow {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string[];
}

interface GoogleRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// ---------------------------------------------------------------------------
// Crypto helpers (same contract as gmail-auth)
// ---------------------------------------------------------------------------

async function getDerivedKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(OAUTH_ENCRYPTION_KEY),
  );
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usage);
}

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

async function decrypt(encoded: string): Promise<string> {
  if (!encoded) return '';
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
// Token expiry check (mirrors isTokenExpired from src/types/oauth.ts)
// ---------------------------------------------------------------------------

function isTokenExpired(expiresAt: string, bufferMs = 5 * 60 * 1000): boolean {
  return new Date(expiresAt).getTime() - bufferMs <= Date.now();
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: string }> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as GoogleRefreshResponse;
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  return { accessToken: data.access_token, expiresAt };
}

// ---------------------------------------------------------------------------
// Gmail API helpers
// ---------------------------------------------------------------------------

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailMessageResponse {
  id: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: Array<{ filename?: string; mimeType?: string }>;
    mimeType?: string;
  };
}

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function hasAttachments(msg: GmailMessageResponse): boolean {
  const parts = msg.payload?.parts ?? [];
  return parts.some(
    (p) => p.filename && p.filename.length > 0 && p.mimeType !== 'text/plain' && p.mimeType !== 'text/html',
  );
}

async function fetchMessageMetadata(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage | null> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error(`[gmail-fetch] Failed to fetch message ${messageId}: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as GmailMessageResponse;
  const headers = data.payload?.headers ?? [];

  return {
    id: data.id,
    sender: getHeader(headers, 'From'),
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    hasAttachments: hasAttachments(data),
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 1. Authenticate user via JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const jwt = authHeader.slice(7);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Fetch encrypted token row (service role to ensure we can read regardless of RLS quirks)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: tokenRow, error: dbError } = await adminClient
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'gmail')
    .single<OAuthTokenRow>();

  if (dbError || !tokenRow) {
    return new Response(JSON.stringify({ error: 'gmail_not_connected' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Decrypt tokens
  let [accessToken, refreshToken] = await Promise.all([
    decrypt(tokenRow.access_token),
    decrypt(tokenRow.refresh_token),
  ]);

  // 4. Auto-refresh if expired
  if (isTokenExpired(tokenRow.expires_at)) {
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'token_expired_no_refresh' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let refreshed: { accessToken: string; expiresAt: string };
    try {
      refreshed = await refreshAccessToken(refreshToken);
    } catch (err) {
      console.error('[gmail-fetch] Refresh error:', err);
      return new Response(JSON.stringify({ error: 'token_refresh_failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    accessToken = refreshed.accessToken;
    const encryptedAccess = await encrypt(accessToken);

    const { error: updateError } = await adminClient
      .from('oauth_tokens')
      .update({
        access_token: encryptedAccess,
        expires_at: refreshed.expiresAt,
      })
      .eq('user_id', user.id)
      .eq('provider', 'gmail');

    if (updateError) {
      console.error('[gmail-fetch] Failed to update refreshed token:', updateError.message);
      // Non-fatal — continue with the refreshed token in memory
    }
  }

  // 5. Fetch inbox message list from Gmail
  const listUrl =
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=label:inbox';
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    console.error('[gmail-fetch] Gmail list error:', listRes.status, err);

    if (listRes.status === 401) {
      // Token was revoked externally — clean up
      await adminClient
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'gmail');
      return new Response(JSON.stringify({ error: 'gmail_access_revoked' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'gmail_api_error', status: listRes.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const listData = (await listRes.json()) as GmailListResponse;
  const messageIds = listData.messages?.map((m) => m.id) ?? [];

  if (messageIds.length === 0) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 6. Fetch metadata for each message (parallel, up to 20)
  const metadataResults = await Promise.all(
    messageIds.map((id) => fetchMessageMetadata(accessToken, id)),
  );

  const messages: GmailMessage[] = metadataResults.filter(
    (m): m is GmailMessage => m !== null,
  );

  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
