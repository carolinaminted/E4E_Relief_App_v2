
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Application } from '../types';

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, onClose }) => {
  const { t } = useTranslation();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const eventDisplay = application.event === 'My disaster is not listed' ? application.otherEvent : application.event;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[#003a70] rounded-lg shadow-xl w-full max-w-2xl m-4 relative border border-[#002a50] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#005ca0] flex justify-between items-center">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                {t('modals.applicationDetail.title', 'Application Details')}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.appId', 'Application ID')}</p>
                    <p className="text-white font-mono">{application.id}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.status', 'Status')}</p>
                    <p className={`font-bold ${statusStyles[application.status]}`}>{application.status}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.submittedDate', 'Submitted Date')}</p>
                    <p className="text-white">{new Date(application.submittedDate).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}</p>
                </div>
                {application.decisionedDate && (
                    <div>
                        <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.decisionedDate', 'Decisioned Date')}</p>
                        <p className="text-white">{new Date(application.decisionedDate).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}</p>
                    </div>
                )}
                <div className="md:col-span-2">
                    <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.eventType', 'Event Type')}</p>
                    <p className="text-white font-semibold">{eventDisplay}</p>
                </div>
                 <div className="md:col-span-2">
                    <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">{t('modals.applicationDetail.requestedAmount', 'Requested Amount')}</p>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${application.requestedAmount.toFixed(2)}</p>
                </div>
            </div>

            {application.reasons && application.reasons.length > 0 && (
                 <div className="border-t border-[#005ca0] pt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('modals.applicationDetail.decisionNotes', 'Decision Notes')}</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {application.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            {application.expenses && application.expenses.length > 0 && (
                <div className="border-t border-[#005ca0] pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('modals.applicationDetail.expensesTitle', 'Expenses')}</h3>
                    <div className="space-y-3">
                        {application.expenses.map((expense, index) => (
                            <div key={index} className="bg-[#004b8d]/50 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="text-white font-medium">{expense.type}</p>
                                    {expense.fileName && (
                                        <a href={expense.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff8400] hover:underline flex items-center gap-1 mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            {expense.fileName}
                                        </a>
                                    )}
                                </div>
                                <p className="text-white font-bold">${Number(expense.amount).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-[#005ca0] bg-[#003a70] rounded-b-lg">
            <button 
                onClick={onClose}
                className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
            >
                {t('common.close', 'Close')}
            </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default ApplicationDetailModal;
