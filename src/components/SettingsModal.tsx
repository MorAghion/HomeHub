import { useState, useEffect } from 'react';
import { X, Copy, Check, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HouseholdMember {
  id: string;
  display_name: string | null;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, signOut, createInvite } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    if (isOpen && profile) {
      fetchHouseholdMembers();
    }
  }, [isOpen, profile]);

  const fetchHouseholdMembers = async () => {
    if (!profile) return;

    try {
      // Use the SECURITY DEFINER function to bypass RLS
      const { data, error } = await supabase
        .rpc('get_household_members');

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
      alert('Failed to create invite code');
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
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

        {/* Household Info */}
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
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#F5F2E7' }}
              >
                <p className="text-sm font-medium" style={{ color: '#630606' }}>
                  {member.display_name || 'Unknown'}
                  {member.id === profile?.id && (
                    <span className="ml-2 text-xs" style={{ color: '#8E806A' }}>
                      (You)
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Partner */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#630606' }}>
            Invite Your Partner
          </h3>
          <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
            Generate a code for your partner to join your household
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
                Valid for 7 days • Share with your partner
              </p>
            </div>
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
