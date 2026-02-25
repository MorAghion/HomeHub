import { useTranslation } from 'react-i18next';

export default function Offline() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-[#F5F2E7] flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="text-2xl font-bold text-[#630606] mb-3">
        {t('offline_title')}
      </h1>
      <p className="text-gray-600 mb-8 max-w-xs">
        {t('offline_message')}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#630606] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#7a0808] transition-colors"
      >
        {t('offline_retry')}
      </button>
    </div>
  );
}
