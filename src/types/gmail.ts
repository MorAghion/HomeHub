/**
 * Gmail types for the client-side API wrapper.
 *
 * GmailMessage is the safe, metadata-only representation of an email.
 * Raw tokens are never included here — they remain exclusively in Edge Functions.
 */

export interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  hasAttachments: boolean;
}

/** Status of the Gmail connection for the current user. */
export type GmailConnectionStatus = 'connected' | 'not_connected' | 'error';
