import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface EligibilityInfoModalProps {
  message: string;
  onClose: () => void;
}

const EligibilityInfoModal: React.FC<EligibilityInfoModalProps> = ({ message, onClose }) => {
  const { t } = useTranslation();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#004b8d] rounded-lg shadow-xl p-6 w-full max-w-sm m-4 relative border border-[#002a50]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <p className="text-white mb-6">{message}</p>
            <button
                onClick={onClose}
                className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-8 rounded-md transition-colors duration-200"
            >
                {t('common.close', 'Close')}
            </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default EligibilityInfoModal;
