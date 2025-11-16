import React, { useState } from 'react';
// FIX: Changed import for `Fund` type to its source file `data/fundData` to resolve export error.
import type { Page, UserProfile, ClassVerificationStatus } from '../types';
import type { Fund } from '../data/fundData';
import { useTranslation } from 'react-i18next';
import { FormInput } from './FormControls';

// A copy of the EligibilityIndicator component, scoped to this file.
const EligibilityIndicator: React.FC<{ cvStatus: ClassVerificationStatus, onClick: () => void }> = ({ cvStatus, onClick }) => {
    const { t } = useTranslation();
    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors";
    const passedClasses = "bg-green-800/50 text-green-300";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 cursor-pointer hover:bg-yellow-800/80";

    const handleClick = () => {
        if (!hasPassedCV) {
             console.log("[Telemetry] verification_needed_cta_clicked_from_relief_queue");
             onClick();
        }
    };

    const text = hasPassedCV ? t('applyPage.eligibility') : t('applyPage.verificationNeeded');
    
    return (
        <button
            onClick={handleClick}
            disabled={hasPassedCV}
            role={hasPassedCV ? 'status' : 'button'}
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
    );
};


interface ReliefQueuePageProps {
  userProfile: UserProfile;
  activeFund: Fund | null;
  onUpdateProfile: (updatedProfile: UserProfile) => Promise<void>;
  onReattemptVerification: (fundCode: string) => void;
  onLogout: () => void;
}

const ReliefQueuePage: React.FC<ReliefQueuePageProps> = ({ userProfile, activeFund, onUpdateProfile, onReattemptVerification, onLogout }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [reattemptFundCode, setReattemptFundCode] = useState(userProfile.fundCode || '');
  const [isReattempting, setIsReattempting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    if (!firstName || !lastName) {
      alert("First and last name cannot be empty.");
      return;
    }
    setSaveStatus('saving');
    await onUpdateProfile({ ...userProfile, firstName, lastName });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleReattempt = () => {
    if (!reattemptFundCode.trim()) {
      alert("Please enter a fund code to re-attempt verification.");
      return;
    }
    onReattemptVerification(reattemptFundCode.trim().toUpperCase());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center">
      <div className="w-full max-w-2xl bg-[#003a70] p-8 rounded-lg shadow-2xl border border-[#005ca0] space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
            Relief Queue
          </h1>
          <p className="text-lg text-gray-300 mt-1">{activeFund?.name} ({userProfile.fundCode})</p>
        </div>

        <div className="flex justify-center">
            <EligibilityIndicator cvStatus={userProfile.classVerificationStatus} onClick={() => setIsReattempting(true)} />
        </div>

        <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] text-left">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Update Your Information</h2>
            <p className="text-sm text-gray-300 mb-6 text-center">If your verification failed due to a typo in your name, you can correct it here and save before re-attempting.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <FormInput label="Last Name" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="bg-[#005ca0] hover:bg-[#006ab3] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>

        <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Re-attempt Verification</h2>
            {!isReattempting ? (
                <button onClick={() => setIsReattempting(true)} className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200">
                    Re-attempt Verification
                </button>
            ) : (
                <div className="space-y-4">
                    <FormInput label="Fund Code" id="fundCode" value={reattemptFundCode} onChange={e => setReattemptFundCode(e.target.value)} />
                    <div className="flex justify-center gap-2">
                         <button onClick={() => setIsReattempting(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
                            Cancel
                        </button>
                        <button onClick={handleReattempt} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
                            Submit for Verification
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="border-t border-[#005ca0] pt-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Need Help?</h2>
            <p className="text-gray-300">Contact support for assistance with your verification.</p>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Email</h3>
              <a href="mailto:support@e4erelief.example" className="font-semibold text-white hover:underline text-lg">support@e4erelief.example</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Phone</h3>
              <a href="tel:800-555-0199" className="font-semibold text-white hover:underline text-lg">(800) 555-0199</a>
            </div>
        </div>
        
        <div className="border-t border-[#005ca0] pt-6">
             <button onClick={onLogout} className="w-full bg-red-800/50 hover:bg-red-700/50 text-red-200 font-bold py-3 px-4 rounded-md transition-colors duration-200">
                Logout
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReliefQueuePage;
