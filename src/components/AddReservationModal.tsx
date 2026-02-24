import { useEffect } from 'react';
import type { VoucherItem, Reservation } from '../types/base';
import { useVoucherForm } from '../hooks/useVoucherForm';

interface AddReservationModalProps {
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

function AddReservationModal({ isOpen, onClose, onSave, listName, listId, editingItem }: AddReservationModalProps) {
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
  } = useVoucherForm('reservation');

  // Pre-populate when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingItem && editingItem.itemType === 'reservation') {
      const r = editingItem as Reservation;
      populateForEdit({
        name: r.name,
        eventDate: r.eventDate || '',
        time: r.time || '',
        address: r.address || '',
        code: r.code || '',
        imageUrl: r.imageUrl || '',
        notes: r.notes || '',
        value: '',
        issuer: '',
        expiryDate: '',
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

    const item: Reservation = {
      id: editingItem?.id ?? crypto.randomUUID(),
      itemType: 'reservation',
      name: formData.name.trim(),
      eventDate: formData.eventDate || undefined,
      time: formData.time.trim() || undefined,
      address: formData.address.trim() || undefined,
      code: formData.code.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSave(item);
    resetForm();
  };

  const isOntopo = listId.includes('ontopo');

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
                {editingItem ? 'Edit Reservation' : 'Add Reservation'}
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
            <div className="p-4 rounded-xl" style={{ backgroundColor: isOntopo ? '#63060608' : 'transparent', border: isOntopo ? 'none' : '1px solid #8E806A22' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <label className="block text-sm font-medium" style={{ color: '#630606' }}>
                  Smart Link / SMS Paste
                </label>
              </div>
              <textarea
                value={smartPaste}
                onChange={(e) => handleSmartPaste(e.target.value)}
                placeholder="Paste reservation link or SMS (Ontopo auto-detected)"
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors resize-none"
                style={{ borderColor: '#8E806A33' }}
                rows={3}
              />
              <p className="text-xs mt-2" style={{ color: '#8E806A' }}>
                💡 Paste SMS or URL to auto-fill fields
              </p>
              {isScraping && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                  <SpinnerSVG /> Fetching details from URL...
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                Reservation Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, listId)}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
              {isScanning && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                  <SpinnerSVG /> Scanning image...
                </div>
              )}
              {isUploading && (
                <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#8E806A' }}>
                  <SpinnerSVG /> Saving to cloud...
                </div>
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Dinner at Taizu"
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
                required
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>Event Date</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>Address / Location</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g., 123 Main St, Tel Aviv"
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Code / Confirmation URL */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                Code / Confirmation URL
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., https://ontopo.com/ticket/..."
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-[#8E806A11]"
                style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isScanning}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#630606' }}
              >
                {isScanning ? 'Processing...' : editingItem ? 'Update' : 'Add'}
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
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>Almost Done!</h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>
                    We auto-filled: <strong>{extractionResults.join(', ')}</strong>
                  </p>
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F59E0B11', border: '1px solid #F59E0B33' }}>
                    <p className="text-sm" style={{ color: '#D97706' }}>Please complete the remaining fields below.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📝</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>Complete the Details</h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>Please fill in the fields below.</p>
                </>
              )}
              <div className="text-start mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F2E7' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#630606' }}>Fields to check:</p>
                <ul className="text-xs space-y-1" style={{ color: '#8E806A' }}>
                  {!formData.name && <li>• Restaurant/Venue Name</li>}
                  {!formData.eventDate && <li>• Event Date</li>}
                  {!formData.time && <li>• Time</li>}
                  {!formData.address && <li>• Address</li>}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowManualFillPrompt(false)}
              className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              Got it, I'll fill the rest
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AddReservationModal;
