import React from 'react';
import { createPortal } from 'react-dom';
import type { Application } from '../types';

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'bg-[#ff8400]/20 text-[#ff8400]',
    Awarded: 'bg-[#edda26]/20 text-[#edda26]',
    Declined: 'bg-red-800 text-red-100',
};

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, onClose }) => {
  if (!application) return null;

  const eventDisplay = application.event === 'My disaster is not listed' 
    ? application.otherEvent || 'Not specified' 
    : application.event;
    
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; // Should not happen

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[#004b8d] rounded-lg shadow-xl p-8 w-full max-w-lg m-4 relative border border-[#002a50]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
          Application Details
        </h2>
        <div className="space-y-4 text-white">
          <div className="flex justify-between border-b border-[#002a50] pb-2">
            <span className="font-semibold text-white opacity-70">Application ID:</span>
            <span className="font-mono">{application.id}</span>
          </div>
          <div className="flex justify-between border-b border-[#002a50] pb-2 items-center">
            <span className="font-semibold text-white opacity-70">Status:</span>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[application.status]}`}>
                {application.status}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#002a50] pb-2">
            <span className="font-semibold text-white opacity-70">Submitted Date:</span>
            <span>{application.submittedDate}</span>
          </div>
           <div className="flex justify-between border-b border-[#002a50] pb-2">
            <span className="font-semibold text-white opacity-70">Decisioned Date:</span>
            <span>{application.decisionedDate}</span>
          </div>
          <div className="flex justify-between border-b border-[#002a50] pb-2">
            <span className="font-semibold text-white opacity-70">Event Type:</span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{eventDisplay}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-[#002a50]">
            <span className="font-semibold text-white opacity-70">Requested Amount:</span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${application.requestedAmount.toFixed(2)}</span>
          </div>
           {application.reasons && application.reasons.length > 0 && (
            <div className="pt-2">
              <h3 className="font-semibold text-white opacity-70 mb-2">Decision Reasons:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 bg-[#003a70]/50 p-3 rounded-md">
                {application.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default ApplicationDetailModal;