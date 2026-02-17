import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home } from 'lucide-react';

function AuthScreen() {
  const { signIn, signUp, joinHousehold } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'join'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Failed to sign in');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message || 'Failed to sign up');
    } else {
      setMessage('Account created! You can now sign in.');
      setMode('signin');
      setPassword('');
    }

    setLoading(false);
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // First sign up
    const { error: signUpError } = await signUp(email, password, displayName);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    // Then join household
    const { error: joinError } = await joinHousehold(inviteCode.toUpperCase());

    if (joinError) {
      setError('Invalid or expired invite code');
    } else {
      setMessage('Successfully joined household!');
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F5F2E7' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#630606' }}>
            <Home size={40} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#630606' }}>
            HomeHub
          </h1>
          <p className="text-sm" style={{ color: '#8E806A' }}>
            Organize your home, together.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
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
              Sign In
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
              Sign Up
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
              Join
            </button>
          </div>

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
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="your@email.com"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="Mor"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="your@email.com"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="••••••••"
                />
                <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                  Minimum 6 characters
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Join Household Form */}
          {mode === 'join' && (
            <form onSubmit={handleJoinHousehold}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606] text-center text-2xl font-mono tracking-widest"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="ABCD1234"
                />
                <p className="text-xs mt-1 text-center" style={{ color: '#8E806A' }}>
                  Enter the 8-character code from your partner
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="Your name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="your@email.com"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                  style={{ borderColor: '#8E806A33' }}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {loading ? 'Joining...' : 'Join Household'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#8E806A' }}>
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}

export default AuthScreen;
