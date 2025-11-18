import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; // Should not happen in normal execution

  // Guard against t() returning a string before translations are loaded.
  const termsContentData = t('modals.terms.body', { returnObjects: true });
  const termsContent: string[] = Array.isArray(termsContentData) ? termsContentData : [];

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[#003a70] rounded-lg shadow-xl p-8 w-full max-w-2xl m-4 relative border border-[#002a50] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-shrink-0 border-b border-[#005ca0] pb-4 mb-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
            {t('modals.terms.title')}
            </h2>
        </div>
        <div className="space-y-4 text-white/90 overflow-y-auto pr-4 text-sm custom-scrollbar">
          {termsContent.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-[#005ca0] flex-shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            {t('modals.terms.closeButton')}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default TermsModal;