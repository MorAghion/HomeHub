/**
 * OAuth Token Types
 *
 * TypeScript interfaces for the `oauth_tokens` table introduced in
 * migration 15-oauth-tokens.sql.
 *
 * IMPORTANT: access_token and refresh_token values in OAuthTokenRow
 * are always ciphertext (AES-256-GCM, base64-encoded). Decryption
 * is performed exclusively in Edge Functions — never in client code.
 */

/** Supported OAuth providers. */
export type OAuthProvider = 'gmail' | 'google_calendar';

/**
 * OAuthTokenRow
 *
 * Mirrors the `oauth_tokens` database table column-for-column.
 * Tokens are ciphertext; never expose raw values to the UI.
 */
export interface OAuthTokenRow {
  id: string;                  // UUID
  user_id: string;             // UUID — auth.users.id
  provider: OAuthProvider;
  access_token: string;        // AES-256-GCM ciphertext, base64
  refresh_token: string;       // AES-256-GCM ciphertext, base64
  expires_at: string;          // ISO timestamp
  scopes: string[];
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

/**
 * OAuthToken
 *
 * Application-layer representation after Edge Function decryption.
 * Only constructed inside Edge Functions — never sent to the browser.
 */
export interface OAuthToken {
  id: string;
  userId: string;
  provider: OAuthProvider;
  accessToken: string;         // plaintext (only in Edge Function scope)
  refreshToken: string;        // plaintext (only in Edge Function scope)
  expiresAt: Date;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * OAuthTokenUpsert
 *
 * Shape for INSERT / UPDATE operations sent from an Edge Function.
 * Tokens must be encrypted before constructing this object.
 */
export interface OAuthTokenUpsert {
  user_id: string;
  provider: OAuthProvider;
  access_token: string;        // must be ciphertext
  refresh_token: string;       // must be ciphertext
  expires_at: string;          // ISO timestamp
  scopes: string[];
}

/**
 * toOAuthToken
 *
 * Maps an OAuthTokenRow (DB, ciphertext) to an OAuthToken (plaintext).
 * Call this only inside an Edge Function after decrypting the token fields.
 */
export function toOAuthToken(row: OAuthTokenRow, decryptedAccess: string, decryptedRefresh: string): OAuthToken {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    accessToken: decryptedAccess,
    refreshToken: decryptedRefresh,
    expiresAt: new Date(row.expires_at),
    scopes: row.scopes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * isTokenExpired
 *
 * Returns true if the token's expires_at is within the given buffer (default 5 min).
 * Use this before making API calls to decide whether to refresh first.
 */
export function isTokenExpired(token: OAuthToken, bufferMs = 5 * 60 * 1000): boolean {
  return token.expiresAt.getTime() - bufferMs <= Date.now();
}
