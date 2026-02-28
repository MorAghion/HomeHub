import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Home } from 'lucide-react';
import WelcomeScreen from './WelcomeScreen';
import NotificationBadge from './NotificationBadge';

type AuthMode = 'signin' | 'signup' | 'join' | 'forgot' | 'reset';

function AuthScreen() {
  const { t } = useTranslation('auth');
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Detect Supabase password-recovery redirect (URL hash contains access_token + type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (import.meta.env.DEV) console.log('[AUTH] handleSignIn: entry — email present:', !!email, 'password present:', !!password, 'loading:', loading);
    setLoading(true);
    setError(null);

    if (import.meta.env.DEV) console.log('[AUTH] handleSignIn: calling signIn()...');
    try {
      const { error } = await signIn(email, password);
      if (import.meta.env.DEV) console.log('[AUTH] handleSignIn: signIn() returned — error:', error ?? 'none');

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError(t('emailNotConfirmed'));
        } else {
          setError(error.message || t('errorSignIn'));
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AUTH] handleSignIn: signIn() threw unexpectedly:', err);
      setError(t('errorUnexpected'));
    }
    // Always reset local button loading. On success, onAuthStateChange(SIGNED_IN)
    // fetches the profile in the background — the auth screen unmounts when user+profile are set.
    if (import.meta.env.DEV) console.log('[AUTH] handleSignIn: resetting local loading state');
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message || t('errorSignUp'));
      setLoading(false);
    } else {
      // Sign-up requires email confirmation — user stays on auth screen, so reset loading.
      setMessage(t('accountCreated'));
      setMode('signin');
      setPassword('');
      setLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Store invite code — onAuthStateChange will process it once the session is ready
    localStorage.setItem('homehub-pending-invite', inviteCode.toUpperCase());

    const { error: signUpError } = await signUp(email, password, displayName);

    if (signUpError) {
      localStorage.removeItem('homehub-pending-invite');
      if (signUpError.message.includes('already a member') || signUpError.message.includes('already in this household')) {
        setError(t('alreadyMember'));
      } else if (signUpError.message.includes('User already registered')) {
        setError(t('alreadyHaveAccount'));
      } else {
        setError(signUpError.message || t('errorCreateAccount'));
      }
    } else {
      setShowWelcome(true);
    }
    // Always reset local button loading — global spinner takes over on success.
    setLoading(false);
  };

  if (showWelcome) {
    return <WelcomeScreen onDismiss={() => setShowWelcome(false)} />;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message || t('errorUnexpected'));
    } else {
      setMessage(t('resetEmailSent'));
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(t('linkExpired'));
    } else {
      setMessage(t('passwordResetSuccess'));
      setMode('signin');
      setNewPassword('');
    }
    setLoading(false);
  };

  const showTabs = mode === 'signin' || mode === 'signup' || mode === 'join';

  return (
    <div
      className="min-h-screen overflow-y-auto px-4 py-8"
      style={{ backgroundColor: '#F5F2E7' }}
    >
      <NotificationBadge />
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#630606' }}>
            <Home size={40} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#630606' }}>
            HomeHub
          </h1>
          <p className="text-sm" style={{ color: '#8E806A' }}>
            {t('tagline')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Mode Tabs — hidden in forgot/reset flows */}
          {showTabs && <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: mode === 'signin' ? '#630606' : 'transparent',
                color: mode === 'signin' ? 'white' : '#630606',
              }}
            >
              {t('signIn')}
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: mode === 'signup' ? '#630606' : 'transparent',
                color: mode === 'signup' ? 'white' : '#630606',
              }}
            >
              {t('signUp')}
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'join'
                  ? 'text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: mode === 'join' ? '#630606' : 'transparent',
                color: mode === 'join' ? 'white' : '#630606',
              }}
            >
              {t('join')}
            </button>
          </div>}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
              {message}
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
              <div className="mb-6 text-end">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                  className="text-xs underline"
                  style={{ color: '#8E806A' }}
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? t('signingIn') : t('signIn')}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#630606' }}>
                {t('forgotPassword')}
              </h2>
              <form onSubmit={handleForgotPassword}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                    style={{ borderColor: '#8E806A33' }}
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 mb-3"
                  style={{ backgroundColor: '#630606' }}
                >
                  {loading ? t('sendingResetLink') : t('sendResetLink')}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
                className="w-full py-2 text-sm underline"
                style={{ color: '#8E806A' }}
              >
                {t('backToSignIn')}
              </button>
            </div>
          )}

          {/* Reset Password Form — always in DOM so tests can find the testid; visible only when mode=reset */}
          <div data-testid="reset-password-form" className={mode === 'reset' ? 'block' : 'hidden'}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#630606' }}>
              {t('resetPassword')}
            </h2>
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required={mode === 'reset'}
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('newPasswordPlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? t('resettingPassword') : t('resetPassword')}
              </button>
            </form>
          </div>

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('displayName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('displayNamePlaceholder')}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('passwordPlaceholder')}
                />
                <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                  {t('passwordMinLength')}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? t('creatingAccount') : t('createAccount')}
              </button>
            </form>
          )}

          {/* Join Household Form */}
          {mode === 'join' && (
            <form onSubmit={handleJoinHousehold}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('inviteCode')}
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606] text-center text-2xl font-mono tracking-widest"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('inviteCodePlaceholder')}
                />
                <p className="text-xs mt-1 text-center" style={{ color: '#8E806A' }}>
                  {t('inviteCodeHelp')}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('yourName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('yourNamePlaceholder')}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? t('joining') : t('joinHousehold')}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#8E806A' }}>
          {t('footer')}
        </p>
      </div>
    </div>
  );
}

export default AuthScreen;
