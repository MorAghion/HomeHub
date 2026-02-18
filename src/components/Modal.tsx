import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Reusable Modal component matching the Burgundy theme.
 * Uses the Visual Viewport API to shift up when the soft keyboard opens.
 */
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const keyboardHeight = useKeyboardHeight();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in pb-4"
        style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : undefined }}
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in overflow-y-auto"
          style={{ maxHeight: `calc(100dvh - ${keyboardHeight + 32}px)` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h3 className="text-xl font-bold mb-4" style={{ color: '#630606' }}>
            {title}
          </h3>

          {/* Content */}
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default Modal;
