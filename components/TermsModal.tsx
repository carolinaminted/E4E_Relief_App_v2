import React from 'react';
import { createPortal } from 'react-dom';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; // Should not happen in normal execution

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
            Terms of Acceptance
            </h2>
        </div>
        <div className="space-y-4 text-white/90 overflow-y-auto pr-4 text-sm">
          <p>By submitting this application, I certify that the information provided is true, correct, and complete to the best of my knowledge. I understand that any false statements, misrepresentations, or omissions may lead to the denial of my application or other disciplinary action, up to and including termination of employment, where applicable.</p>
          <p>I authorize E4E Relief and its agents to verify the information provided in this application. I understand that this assistance is intended to provide temporary relief for qualified disaster events and may not cover all of my expenses.</p>
          <p>I agree to release and hold harmless E4E Relief, my employer, and their respective officers, directors, employees, and agents from any and all claims, liabilities, or causes of action arising out of or related to this application and any assistance provided.</p>
          <p>I understand that the funds are granted based on the information provided and are subject to availability. Receiving an award does not guarantee future assistance. All decisions made by E4E Relief are final.</p>
        </div>
        <div className="mt-6 pt-4 border-t border-[#005ca0] flex-shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            I Have Read and Understood
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default TermsModal;