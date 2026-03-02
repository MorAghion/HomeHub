import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

function NotificationBadge() {
  const { t } = useTranslation('auth');
  const { notification, clearNotification } = useAuth();

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(clearNotification, 8000);
    return () => clearTimeout(timer);
  }, [notification, clearNotification]);

  return (
    <div
      data-testid="notification-badge"
      className={
        notification
          ? 'fixed top-4 inset-x-4 z-50 bg-[#630606] text-white rounded-xl p-4 shadow-lg text-sm'
          : 'hidden'
      }
    >
      {notification && (
        <>
          <p className="font-medium">
            {t('partnerJoined', { name: notification.displayName })}
          </p>
          <button
            type="button"
            onClick={clearNotification}
            className="text-xs mt-1 underline opacity-80"
          >
            {t('viewSettings')}
          </button>
        </>
      )}
    </div>
  );
}

export default NotificationBadge;
