
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface AIApplyPreviewModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const AIApplyPreviewModal: React.FC<AIApplyPreviewModalProps> = ({ onClose, children }) => {
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
                className="bg-[#003a70] rounded-lg shadow-xl p-0 w-full max-w-lg m-4 relative border border-[#002a50] max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center border-b border-[#005ca0] p-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        {t('aiApplyPage.progressTitle')}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <div className="flex-1 flex flex-col min-h-0">
                     {children}
                </div>
                <footer className="p-4 border-t border-[#005ca0] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {t('common.close', 'Close')}
                    </button>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default AIApplyPreviewModal;
