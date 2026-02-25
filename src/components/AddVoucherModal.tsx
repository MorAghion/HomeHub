import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { VoucherItem, Voucher } from '../types/base';
import { useVoucherForm } from '../hooks/useVoucherForm';

interface AddVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: VoucherItem) => void;
  listName: string;
  listId: string;
  editingItem?: VoucherItem | null;
}

const SpinnerSVG = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

function AddVoucherModal({ isOpen, onClose, onSave, listName, listId, editingItem }: AddVoucherModalProps) {
  const { t } = useTranslation('vouchers');
  const {
    formData, setFormData,
    smartPaste,
    imageSize, setImageSize,
    isScraping, isScanning, isUploading,
    showManualFillPrompt, setShowManualFillPrompt,
    extractionResults,
    resetForm,
    populateForEdit,
    handleSmartPaste,
    handleImageUpload,
  } = useVoucherForm('voucher');

  const isPhysical = listId.includes('physical');

  // Pre-populate when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingItem && editingItem.itemType === 'voucher') {
      const v = editingItem as Voucher;
      populateForEdit({
        name: v.name,
        value: v.value || '',
        issuer: v.issuer || '',
        expiryDate: v.expiryDate || '',
        code: v.code || '',
        imageUrl: v.imageUrl || '',
        notes: v.notes || '',
        eventDate: '',
        time: '',
        address: '',
      });
    } else if (!editingItem) {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const item: Voucher = {
      id: editingItem?.id ?? crypto.randomUUID(),
      itemType: 'voucher',
      name: formData.name.trim(),
      value: formData.value.trim() || undefined,
      issuer: formData.issuer.trim() || undefined,
      expiryDate: formData.expiryDate || undefined,
      code: formData.code.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSave(item);
    resetForm();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
                {editingItem ? t('editVoucher') : t('addVoucher')}
              </h2>
              <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                {listName}
              </p>
            </div>
            <button onClick={handleClose} className="text-2xl hover:opacity-50 transition-opacity" style={{ color: '#8E806A' }}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Smart Paste */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#63060608' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <label className="block text-sm font-medium" style={{ color: '#630606' }}>
                  {t('smartLinkLabel')}
                </label>
              </div>
              <textarea
                value={smartPaste}
                onChange={(e) => handleSmartPaste(e.target.value)}
                placeholder={t('smartLinkPlaceholderVoucher')}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors resize-none"
                style={{ borderColor: '#8E806A33' }}
                rows={3}
              />
              <p className="text-xs mt-2" style={{ color: '#8E806A' }}>
                {t('smartLinkHint')}
              </p>
              {isScraping && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                  <SpinnerSVG /> {t('fetchingDetails')}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className={isPhysical ? 'p-4 rounded-xl' : ''} style={isPhysical ? { backgroundColor: '#63060608' } : {}}>
              {isPhysical && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📸</span>
                  <label className="block text-sm font-medium" style={{ color: '#630606' }}>
                    {t('uploadCardPhoto')}
                  </label>
                </div>
              )}
              {!isPhysical && (
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  {t('cardPhoto')}
                </label>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, listId)}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
              {isScanning && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                  <SpinnerSVG /> {t('scanningImage')}
                </div>
              )}
              {isUploading && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#8E806A' }}>
                  <SpinnerSVG /> {t('savingToCloud')}
                </div>
              )}
              {isPhysical && (
                <p className="text-xs mt-2" style={{ color: '#8E806A' }}>
                  {t('photoHint')}
                </p>
              )}
            </div>

            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="relative">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, imageUrl: '' })); setImageSize(''); }}
                  className="absolute top-2 end-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {imageSize && (
                  <div className="absolute bottom-2 start-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {imageSize}
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>{t('name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('namePlaceholderVoucher')}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
                required
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>{t('value')}</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={t('voucherValuePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Issuer */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>{t('issuer')}</label>
              <input
                type="text"
                value={formData.issuer}
                onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                placeholder={t('voucherIssuerPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>{t('expiryDate')}</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                {t('codeLabel')}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder={t('codePlaceholderVoucher')}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
              {formData.code?.includes(' / ') && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('multipleCodesDetected')}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-[#8E806A11]"
                style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
              >
                {t('cancel', { ns: 'common' })}
              </button>
              <button
                type="submit"
                disabled={isScanning}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {isScanning ? t('processing') : editingItem ? t('update') : t('add')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Manual Fill Prompt */}
      {showManualFillPrompt && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowManualFillPrompt(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              {extractionResults.length > 0 ? (
                <>
                  <div className="text-5xl mb-3">✅</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>{t('almostDone')}</h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>
                    {t('autoFilledPrefix')} <strong>{extractionResults.join(', ')}</strong>
                  </p>
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F59E0B11', border: '1px solid #F59E0B33' }}>
                    <p className="text-sm" style={{ color: '#D97706' }}>{t('completeRemaining')}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📝</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>{t('completeDetails')}</h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>{t('fillBelow')}</p>
                </>
              )}
              <div className="text-start mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F2E7' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#630606' }}>{t('fieldsToCheck')}</p>
                <ul className="text-xs space-y-1" style={{ color: '#8E806A' }}>
                  {!formData.name && <li>• Voucher Name</li>}
                  {!formData.value && <li>• Value</li>}
                  {!formData.expiryDate && <li>• Expiry Date</li>}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowManualFillPrompt(false)}
              className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AddVoucherModal;
