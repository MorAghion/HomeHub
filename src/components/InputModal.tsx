import { useState, useEffect } from 'react';
import Modal from './Modal';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  placeholder?: string;
  initialValue?: string;
  submitText?: string;
  cancelText?: string;
}

/**
 * Reusable Input Modal for creating/editing Sub-Hubs
 */
function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = '',
  initialValue = '',
  submitText = 'Save',
  cancelText = 'Cancel',
}: InputModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#63060611] outline-none mb-6 transition-all"
          style={{ color: '#8E806A' }}
          autoFocus
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: '#630606' }}
          >
            {submitText}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('');
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
          >
            {cancelText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default InputModal;
