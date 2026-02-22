import { useState, useRef } from 'react';
import { Upload, X, Link } from 'lucide-react';
import type { Reservation } from '../../types/reservation';
import { supabase } from '../../supabaseClient';

interface CreateReservationFormProps {
  householdId: string;
  userId: string;
  /** Called after successful save. */
  onSave: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  /** Pre-populate for edit mode */
  initial?: Partial<Reservation>;
}

const ONTOPO_PATTERN = /ontopo\.com/i;

async function parseOntopoUrl(url: string): Promise<Partial<Reservation>> {
  // Ontopo URLs encode restaurant name in the path — best-effort parse
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // e.g. /en/restaurant-name
    const namePart = parts[1] ?? parts[0];
    const name = namePart ? decodeURIComponent(namePart).replace(/-/g, ' ') : undefined;
    return { name };
  } catch {
    return {};
  }
}

function CreateReservationForm({ householdId, userId, onSave, onCancel, initial }: CreateReservationFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [smartPasteUrl, setSmartPasteUrl] = useState('');
  const [smartPasteLoading, setSmartPasteLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `reservations/${householdId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('voucher-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('voucher-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSmartPaste = async () => {
    if (!ONTOPO_PATTERN.test(smartPasteUrl)) return;
    setSmartPasteLoading(true);
    try {
      const parsed = await parseOntopoUrl(smartPasteUrl);
      if (parsed.name && !name) setName(parsed.name);
    } finally {
      setSmartPasteLoading(false);
      setSmartPasteUrl('');
    }
  };

  const handleSmartPasteChange = async (raw: string) => {
    setSmartPasteUrl(raw);
    if (ONTOPO_PATTERN.test(raw)) {
      setSmartPasteLoading(true);
      try {
        const parsed = await parseOntopoUrl(raw);
        if (parsed.name && !name) setName(parsed.name);
      } finally {
        setSmartPasteLoading(false);
        setSmartPasteUrl('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        eventDate: eventDate || undefined,
        time: time || undefined,
        address: address.trim() || undefined,
        imageUrl: imageUrl || undefined,
        notes: notes.trim() || undefined,
        householdId,
        createdBy: userId,
      });
    } finally {
      setSaving(false);
    }
  };

  const labelClass = 'block text-xs font-medium uppercase tracking-wide mb-1';
  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#8A9A8B]';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Smart Paste */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl"
        style={{ backgroundColor: '#8A9A8B11', border: '1px dashed #8A9A8B55' }}
      >
        <Link size={14} strokeWidth={2} style={{ color: '#8A9A8B' }} />
        <input
          type="url"
          value={smartPasteUrl}
          onChange={(e) => handleSmartPasteChange(e.target.value)}
          onBlur={handleSmartPaste}
          placeholder="Paste an Ontopo link to auto-fill…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#1a1a1a' }}
        />
        {smartPasteLoading && (
          <div className="w-4 h-4 border-2 border-[#8A9A8B] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Name (required) */}
      <div>
        <label className={labelClass} style={{ color: '#8E806A' }}>
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Dinner at Noma"
          className={inputClass}
          style={{ borderColor: '#8E806A33', color: '#1a1a1a' }}
        />
      </div>

      {/* Date + Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} style={{ color: '#8E806A' }}>Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClass}
            style={{ borderColor: '#8E806A33', color: '#1a1a1a' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: '#8E806A' }}>Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
            style={{ borderColor: '#8E806A33', color: '#1a1a1a' }}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelClass} style={{ color: '#8E806A' }}>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St, Tel Aviv"
          className={inputClass}
          style={{ borderColor: '#8E806A33', color: '#1a1a1a' }}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className={labelClass} style={{ color: '#8E806A' }}>Image</label>
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Reservation"
              className="w-full max-h-40 object-contain rounded-xl"
              style={{ border: '1px solid #8E806A22' }}
            />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 end-2 p-1 bg-white rounded-full shadow"
            >
              <X size={14} strokeWidth={2} style={{ color: '#8E806A' }} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm transition-colors hover:border-[#8A9A8B] hover:bg-[#8A9A8B08]"
            style={{ borderColor: '#8E806A33', color: '#8E806A' }}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-[#8A9A8B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={16} strokeWidth={2} />
            )}
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass} style={{ color: '#8E806A' }}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Confirmation number, dress code, etc."
          className={`${inputClass} resize-none`}
          style={{ borderColor: '#8E806A33', color: '#1a1a1a' }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-medium transition-colors hover:bg-[#8E806A11]"
          style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading || !name.trim()}
          className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#8A9A8B' }}
        >
          {saving ? 'Saving…' : 'Save Reservation'}
        </button>
      </div>
    </form>
  );
}

export default CreateReservationForm;
