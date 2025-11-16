import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ClassVerificationStatus } from '../types';
import EligibilityInfoModal from './EligibilityInfoModal';

interface EligibilityIndicatorProps {
  cvStatus: ClassVerificationStatus;
}

const EligibilityIndicator: React.FC<EligibilityIndicatorProps> = ({ cvStatus }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer";
    const passedClasses = "bg-green-800/50 text-green-300 hover:bg-green-800/80";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 hover:bg-yellow-800/80";

    const handleClick = () => {
        if (hasPassedCV) {
             setModalMessage(t('eligibilityIndicator.eligibleMessage'));
             setIsModalOpen(true);
        } else {
             setModalMessage(t('eligibilityIndicator.verificationNeededMessage'));
             setIsModalOpen(true);
        }
    };

    const text = hasPassedCV ? t('applyPage.eligibility') : t('applyPage.verificationNeeded');
    
    return (
        <>
            <button
                onClick={handleClick}
                role="button"
                aria-label={text}
                className={`${baseClasses} ${hasPassedCV ? passedClasses : neededClasses}`}
            >
                {!hasPassedCV && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                )}
                <span>{text}</span>
            </button>
            {isModalOpen && <EligibilityInfoModal message={modalMessage} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default EligibilityIndicator;
