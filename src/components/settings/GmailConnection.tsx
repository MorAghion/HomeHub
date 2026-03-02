import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { connectGmail, disconnectGmail } from '../../lib/api/gmail';
import type { GmailConnectionStatus } from '../../types/gmail';

function GmailConnection() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();

  const [status, setStatus] = useState<GmailConnectionStatus>('not_connected');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    handleOAuthCallback();
    checkConnectionStatus();
  }, [user]);

  const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected') {
      const url = new URL(window.location.href);
      url.searchParams.delete('gmail');
      history.replaceState({}, '', url.toString());
    }
  };

  const checkConnectionStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: dbError } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('provider', 'gmail')
        .eq('user_id', user.id);

      if (dbError) throw dbError;
      setStatus(data && data.length > 0 ? 'connected' : 'not_connected');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      await connectGmail();
      // connectGmail redirects — this line only runs on failure
    } catch {
      setError(t('gmailConnectError'));
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectGmail();
      setStatus('not_connected');
      setShowConfirm(false);
    } catch {
      setError(t('gmailDisconnectError'));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
      <div className="flex items-center gap-2 mb-2">
        <Mail size={18} style={{ color: '#630606' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#630606' }}>
          {t('gmailConnection')}
        </h3>
      </div>
      <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
        {t('gmailConnectionDescription')}
      </p>

      {loading ? (
        <div data-testid="gmail-status" className="flex items-center gap-2 py-2">
          <Loader2 size={16} className="animate-spin" style={{ color: '#630606' }} />
        </div>
      ) : status === 'connected' ? (
        <div data-testid="gmail-status">
          {!showConfirm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: '#10B981' }} />
                <span className="text-sm font-medium" style={{ color: '#10B981' }}>
                  {t('gmailConnected', { email: user?.email ?? '' })}
                </span>
              </div>
              <button
                data-testid="gmail-disconnect-btn"
                onClick={() => setShowConfirm(true)}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ color: '#DC2626', border: '1.5px solid #DC2626', backgroundColor: 'transparent' }}
              >
                {t('disconnectGmail')}
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-3 rounded-lg" style={{ border: '1.5px solid #DC2626', backgroundColor: '#FEF2F2' }}>
              <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                {t('confirmDisconnect')}
              </p>
              <p className="text-xs" style={{ color: '#7F1D1D' }}>
                {t('confirmDisconnectMessage')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={disconnecting}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 disabled:opacity-50"
                  style={{ color: '#6B7280', border: '1px solid #D1D5DB' }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  {disconnecting ? '...' : t('disconnectGmail')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div data-testid="gmail-status">
          <button
            data-testid="gmail-connect-btn"
            onClick={handleConnect}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#630606' }}
          >
            {t('connectGmail')}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#DC2626' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default GmailConnection;
