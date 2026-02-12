import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

/**
 * Reusable Confirmation Modal for delete actions
 */
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
        {message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          className="flex-1 py-2.5 rounded-lg font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: isDestructive ? '#630606' : '#630606' }}
        >
          {confirmText}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;
