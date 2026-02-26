import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { X, Copy, Check, Users, LogOut, UserMinus, Crown, Trash2, Globe } from 'lucide-react';
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
  const { profile, signOut, createInvite, joinHousehold, removeMember, deleteHousehold, isOwner } = useAuth();
  const { t } = useTranslation('settings');
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('homehub-lang', lang);
    setCurrentLang(lang);
  };
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

  // Delete household state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      alert(msg.includes('owner') ? t('ownerOnlyError') : t('failedCreateInvite'));
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

  const handleDeleteHousehold = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleteLoading(true);
    const { error } = await deleteHousehold();
    if (error) {
      const msg = (error as any)?.message || t('failedDeleteHousehold');
      alert(msg);
      setDeleteLoading(false);
    }
    // On success: AuthContext calls signOut → user/profile cleared → app shows auth screen
  };

  const handleSignOut = async () => {
    if (confirm(t('signOutConfirm'))) {
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
    if (!confirm(t('removeMemberConfirm', { name: memberName || t('unknown') }))) return;

    setRemovingMemberId(memberId);
    const { error } = await removeMember(memberId);

    if (error) {
      const msg = (error as any)?.message || t('failedRemoveMember');
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
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          >
            <X size={20} style={{ color: '#8E806A' }} />
          </button>
        </div>

        {/* Language Toggle */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} style={{ color: '#630606' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#630606' }}>
              {t('language')}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => switchLanguage('en')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: currentLang === 'en' ? '#630606' : 'white',
                color: currentLang === 'en' ? 'white' : '#630606',
                border: currentLang === 'en' ? 'none' : '1.5px solid #63060644',
              }}
            >
              {t('english')}
            </button>
            <button
              onClick={() => switchLanguage('he')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: currentLang === 'he' ? '#630606' : 'white',
                color: currentLang === 'he' ? 'white' : '#630606',
                border: currentLang === 'he' ? 'none' : '1.5px solid #63060644',
              }}
            >
              {t('hebrew')}
            </button>
          </div>
        </div>

        {/* Household Members */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} style={{ color: '#630606' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
              {t('householdMembers')}
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
                    {member.display_name || t('unknown')}
                  </p>
                  {member.id === profile?.id && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#8E806A' }}>{t('you')}</span>
                  )}
                  {member.is_owner && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#8E806A' }}>{t('owner')}</span>
                  )}
                </div>
                {/* Remove button — only visible to the owner, for non-owner members */}
                {isOwner && !member.is_owner && member.id !== profile?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.display_name)}
                    disabled={removingMemberId === member.id}
                    className="ms-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-red-100 disabled:opacity-40 flex-shrink-0"
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
            {t('invitePartner')}
          </h3>

          {isOwner ? (
            <>
              <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
                {t('inviteDesc')}
              </p>
              {!inviteCode ? (
                <button
                  onClick={handleCreateInvite}
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#630606' }}
                >
                  {loading ? t('generating') : t('generateInviteCode')}
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
                    {t('inviteValidity')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: '#8E806A' }}>
              {t('ownerOnlyInvite')}
            </p>
          )}
        </div>

        {/* Join a Household (for authenticated users with an invite code) */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#630606' }}>
            {t('joinHousehold')}
          </h3>
          <p className="text-xs mb-3" style={{ color: '#8E806A' }}>
            {t('joinDesc')}
          </p>

          {joinSuccess ? (
            <div className="flex items-center gap-2 text-sm py-2" style={{ color: '#10B981' }}>
              <Check size={16} />
              {t('joinSuccess')}
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
                placeholder={t('inviteCodePlaceholder')}
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
                {joinLoading ? t('joining') : t('joinButton')}
              </button>
            </form>
          )}
        </div>

        {/* Delete Household — owner only */}
        {isOwner && (
          <div className="mb-4">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
                style={{ backgroundColor: 'transparent', color: '#DC2626', border: '1.5px solid #DC2626' }}
              >
                <Trash2 size={16} />
                {t('deleteHousehold')}
              </button>
            ) : (
              <div className="p-4 rounded-xl space-y-3" style={{ border: '1.5px solid #DC2626', backgroundColor: '#FEF2F2' }}>
                <div className="flex items-start gap-2">
                  <Trash2 size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                      {t('deleteHouseholdConfirm')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#7F1D1D' }}>
                      {t('deleteHouseholdDesc')}
                    </p>
                    <p className="text-xs mt-2 font-medium" style={{ color: '#7F1D1D' }}>
                      {t('otherMembersWillLose')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#7F1D1D' }}>
                    {t('typeDeleteToConfirm')}
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 rounded-lg border-2 text-sm font-mono focus:outline-none transition-colors"
                    style={{ borderColor: deleteInput === 'DELETE' ? '#DC2626' : '#FCA5A5' }}
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
                    style={{ color: '#6B7280', border: '1px solid #D1D5DB' }}
                    disabled={deleteLoading}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleDeleteHousehold}
                    disabled={deleteInput !== 'DELETE' || deleteLoading}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    {deleteLoading ? t('deleting') : t('deleteEverything')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-70"
          style={{ backgroundColor: '#DC2626', color: 'white' }}
        >
          <LogOut size={18} />
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;
