import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

interface WelcomeScreenProps {
  householdName?: string;
  onDismiss: () => void;
}

function WelcomeScreen({ householdName, onDismiss }: WelcomeScreenProps) {
  const { t } = useTranslation('auth');

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#F5F2E7' }}>
      <div className="text-center px-8 py-12 max-w-sm w-full">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: '#630606' }}
        >
          <Home size={40} strokeWidth={2} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ color: '#630606' }}>
          {householdName ? t('welcomeToHousehold', { name: householdName }) : t('welcomeToHousehold')}
        </h2>
        <p className="text-base mb-8" style={{ color: '#8E806A' }}>
          {t('youveJoined')}
        </p>
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#630606' }}
        >
          {t('getStarted')}
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
