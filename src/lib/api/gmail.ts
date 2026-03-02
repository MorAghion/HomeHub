/**
 * Gmail client-side API wrapper.
 *
 * These functions are the ONLY way the frontend should interact with Gmail:
 *   - connectGmail()        → kicks off the OAuth flow
 *   - fetchGmailMessages()  → returns email metadata from the Edge Function
 *   - disconnectGmail()     → removes the user's token row from oauth_tokens
 *
 * Tokens are NEVER handled or visible in this file.
 * All token work happens exclusively in Supabase Edge Functions.
 */

import { supabase } from '../../supabaseClient';
import type { GmailMessage } from '../../types/gmail';

const FUNCTIONS_BASE_URL = 'https://wwqvjiekakjetspucfxp.supabase.co/functions/v1';

/**
 * Returns the current Supabase session's access token.
 * Throws if the user is not authenticated.
 */
async function getSessionToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('User is not authenticated');
  }
  return session.access_token;
}

/**
 * connectGmail
 *
 * Calls the gmail-auth/authorize Edge Function, which redirects the user
 * to Google's OAuth consent screen. The function call itself triggers the
 * browser redirect — this function does not return to the caller.
 *
 * The user is redirected back to /settings?gmail=connected on success.
 */
export async function connectGmail(): Promise<void> {
  const token = await getSessionToken();

  // The authorize endpoint responds with a 302 redirect.
  // We use window.location.href so the browser follows the redirect to Google.
  const authorizeUrl = `${FUNCTIONS_BASE_URL}/gmail-auth/authorize`;

  // Fetch with redirect: 'manual' to capture the Location header,
  // then redirect the browser there. This avoids CORS issues with 302s.
  const res = await fetch(authorizeUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'manual',
  });

  // A successful response will be a redirect (status 0 for opaque-redirect,
  // or 302 if same-origin). We follow the Location header manually.
  const location = res.headers.get('Location') ?? res.url;
  if (location) {
    window.location.href = location;
  } else {
    throw new Error('Failed to initiate Gmail OAuth: no redirect URL returned');
  }
}

/**
 * fetchGmailMessages
 *
 * Calls the gmail-fetch Edge Function and returns an array of email metadata.
 * Throws on network errors or if Gmail is not connected.
 */
export async function fetchGmailMessages(): Promise<GmailMessage[]> {
  const token = await getSessionToken();

  const res = await fetch(`${FUNCTIONS_BASE_URL}/gmail-fetch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'unknown_error' }));
    const code: string = (body as { error?: string }).error ?? 'unknown_error';

    if (res.status === 404 && code === 'gmail_not_connected') {
      throw new Error('gmail_not_connected');
    }
    if (res.status === 401 && code === 'gmail_access_revoked') {
      throw new Error('gmail_access_revoked');
    }
    throw new Error(`gmail_fetch_failed:${res.status}`);
  }

  return res.json() as Promise<GmailMessage[]>;
}

/**
 * disconnectGmail
 *
 * Deletes the user's Gmail token row from oauth_tokens via the Supabase client.
 * After this, the user will need to reconnect via connectGmail().
 *
 * Note: deletion is done from the client using the authenticated Supabase client.
 * RLS ensures only the owner can delete their own row.
 */
export async function disconnectGmail(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User is not authenticated');
  }

  const { error } = await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'gmail');

  if (error) {
    throw new Error(`Failed to disconnect Gmail: ${error.message}`);
  }
}
