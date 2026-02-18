import { useState, useEffect } from 'react';
import { X, Copy, Check, Users, LogOut, UserMinus, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HouseholdMember {
  id: string;
  display_name: string | null;
  is_owner: boolean;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, signOut, createInvite, joinHousehold, removeMember, isOwner } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  // Join household state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Remove member state
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profile) {
      fetchHouseholdMembers();
    }
  }, [isOpen, profile]);

  const fetchHouseholdMembers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase.rpc('get_household_members');
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching household members:', error);
    }
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    const { code, error } = await createInvite();

    if (error) {
      const msg = (error as any)?.message || '';
      alert(msg.includes('owner') ? 'Only the household owner can generate invite codes.' : 'Failed to create invite code.');
    } else {
      setInviteCode(code);
    }

    setLoading(false);
  };

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      onClose();
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setJoinError(null);

    const { error } = await joinHousehold(joinCode.trim().toUpperCase());

    if (error) {
      const msg = (error as any)?.message || 'Invalid or expired invite code.';
      setJoinError(msg);
    } else {
      setJoinSuccess(true);
      setJoinCode('');
      await fetchHouseholdMembers();
      setTimeout(() => setJoinSuccess(false), 3000);
    }

    setJoinLoading(false);
  };

  const handleRemoveMember = async (memberId: string, memberName: string | null) => {
    if (!confirm(`Remove ${memberName || 'this member'} from the household?`)) return;

    setRemovingMemberId(memberId);
    const { error } = await removeMember(memberId);

    if (error) {
      const msg = (error as any)?.message || 'Failed to remove member.';
      alert(msg);
    } else {
      await fetchHouseholdMembers();
    }

    setRemovingMemberId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          >
            <X size={20} style={{ color: '#8E806A' }} />
          </button>
        </div>

        {/* Household Members */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} style={{ color: '#630606' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
              Household Members
            </h3>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: '#F5F2E7' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {member.is_owner && (
                    <Crown size={14} style={{ color: '#630606', flexShrink: 0 }} />
                  )}
                  <p className="text-sm font-medium truncate" style={{ color: '#630606' }}>
                    {member.display_name || 'Unknown'}
                  </p>
                  {member.id === profile?.id && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#8E806A' }}>(You)</span>
                  )}
                  {member.is_owner && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#8E806A' }}>Owner</span>
                  )}
                </div>
                {/* Remove button — only visible to the owner, for non-owner members */}
                {isOwner && !member.is_owner && member.id !== profile?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.display_name)}
                    disabled={removingMemberId === member.id}
                    className="ml-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-red-100 disabled:opacity-40 flex-shrink-0"
                    title={`Remove ${member.display_name || 'member'}`}
                  >
                    <UserMinus size={14} style={{ color: '#DC2626' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite Partner — owner only */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#630606' }}>
            Invite Your Partner
          </h3>

          {isOwner ? (
            <>
              <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
                Generate a one-time code for your partner to join your household
              </p>
              {!inviteCode ? (
                <button
                  onClick={handleCreateInvite}
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#630606' }}
                >
                  {loading ? 'Generating...' : 'Generate Invite Code'}
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex-1 text-center py-3 px-4 rounded-lg font-mono text-2xl font-bold tracking-widest"
                      style={{ backgroundColor: 'white', color: '#630606' }}
                    >
                      {inviteCode}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                      style={{ backgroundColor: copied ? '#10B981' : '#630606' }}
                      title="Copy code"
                    >
                      {copied ? (
                        <Check size={20} className="text-white" />
                      ) : (
                        <Copy size={20} className="text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-center" style={{ color: '#8E806A' }}>
                    Valid for 24 hours • Single-use
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: '#8E806A' }}>
              Only the household owner can generate invite codes.
            </p>
          )}
        </div>

        {/* Join a Household (for authenticated users with an invite code) */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#630606' }}>
            Join Another Household
          </h3>
          <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
            Have an invite code? Enter it to switch to another household.
          </p>

          {joinSuccess ? (
            <div className="flex items-center gap-2 text-sm py-2" style={{ color: '#10B981' }}>
              <Check size={16} />
              Successfully joined household!
            </div>
          ) : (
            <form onSubmit={handleJoinHousehold} className="space-y-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                placeholder="Enter invite code (e.g. ABCD1234)"
                maxLength={8}
                className="w-full px-3 py-2 rounded-lg border-2 font-mono text-sm font-medium tracking-widest focus:outline-none focus:border-[#630606] transition-colors uppercase"
                style={{ borderColor: joinError ? '#DC2626' : '#8E806A33' }}
                disabled={joinLoading}
              />
              {joinError && (
                <p className="text-xs" style={{ color: '#DC2626' }}>
                  {joinError}
                </p>
              )}
              <button
                type="submit"
                disabled={joinLoading || !joinCode.trim()}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {joinLoading ? 'Joining...' : 'Join Household'}
              </button>
            </form>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-70"
          style={{ backgroundColor: '#DC2626', color: 'white' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;
