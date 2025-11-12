import React, { useState, useEffect } from 'react';
import type { Application, UserProfile, ApplicationFormData, EventData, ClassVerificationStatus } from '../types';

// Import step components
import ApplyContactPage from './ApplyContactPage';
import ApplyEventPage from './ApplyEventPage';
import ApplyExpensesPage from './ApplyExpensesPage';
import ApplyTermsPage from './ApplyTermsPage';

interface ApplyPageProps {
  navigate: (page: 'home' | 'profile' | 'eligibility' | 'classVerification') => void;
  onSubmit: (application: ApplicationFormData) => Promise<void>;
  userProfile: UserProfile;
  applicationDraft: Partial<ApplicationFormData> | null;
  mainRef: React.RefObject<HTMLElement>;
}

const EligibilityIndicator: React.FC<{ cvStatus: ClassVerificationStatus, onClick: () => void }> = ({ cvStatus, onClick }) => {
    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors";
    const passedClasses = "bg-green-800/50 text-green-300";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 cursor-pointer hover:bg-yellow-800/80";

    const handleClick = () => {
        if (!hasPassedCV) {
             console.log("[Telemetry] verification_needed_cta_clicked_from_apply_page");
             onClick();
        }
    };

    const text = hasPassedCV ? 'Eligible to apply' : 'Verification needed';
    
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

const ApplyPage: React.FC<ApplyPageProps> = ({ navigate, onSubmit, userProfile, applicationDraft, mainRef }) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<ApplicationFormData>(() => {
    const draftKey = `applicationDraft-${userProfile.uid}-${userProfile.fundCode}`;
    try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            console.log("Loading saved application draft from localStorage.");
            return JSON.parse(savedDraft);
        }
    } catch (error) {
        console.error("Could not parse saved application draft:", error);
        localStorage.removeItem(draftKey); // Clear corrupted data
    }

    const draftProfile: Partial<UserProfile> = applicationDraft?.profileData || {};
    const draftEvent: Partial<EventData> = applicationDraft?.eventData || {};

    const initialProfile = {
      ...userProfile,
      ...draftProfile,
      primaryAddress: {
        ...userProfile.primaryAddress,
        ...(draftProfile.primaryAddress || {}),
      },
      mailingAddress: {
        ...(userProfile.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }),
        ...(draftProfile.mailingAddress || {}),
      },
    };

    const initialEvent: EventData = {
        event: '',
        otherEvent: '',
        eventDate: '',
        evacuated: '',
        evacuatingFromPrimary: '',
        evacuationReason: '',
        stayedWithFamilyOrFriend: '',
        evacuationStartDate: '',
        evacuationNights: '',
        powerLoss: '',
        powerLossDays: '',
        additionalDetails: '',
        requestedAmount: 0,
        expenses: [],
        ...draftEvent,
    };

    return {
        profileData: initialProfile,
        eventData: initialEvent,
        agreementData: {
            shareStory: null,
            receiveAdditionalInfo: null,
        },
    };
  });

  useEffect(() => {
    if (userProfile.uid && userProfile.fundCode) {
        const draftKey = `applicationDraft-${userProfile.uid}-${userProfile.fundCode}`;
        try {
            localStorage.setItem(draftKey, JSON.stringify(formData));
        } catch (error) {
            console.error("Could not save application draft to localStorage:", error);
        }
    }
  }, [formData, userProfile.uid, userProfile.fundCode]);

  const nextStep = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setStep(prev => prev - 1);
  };
  
  const updateProfileData = (newData: Partial<UserProfile>) => {
      setFormData(prev => ({ 
          ...prev, 
          profileData: { ...prev.profileData, ...newData } 
      }));
  };
  
  const updateEventData = (newData: Partial<ApplicationFormData['eventData']>) => {
      setFormData(prev => ({
          ...prev,
          eventData: { ...prev.eventData, ...newData }
      }));
  };

  const updateAgreementData = (newData: Partial<ApplicationFormData['agreementData']>) => {
      setFormData(prev => ({
          ...prev,
          agreementData: { ...prev.agreementData, ...newData }
      }));
  };
  
  const handleAIParsedData = (parsedData: Partial<ApplicationFormData>) => {
    setFormData(prev => {
        const newProfileData = parsedData.profileData ? {
            ...prev.profileData,
            ...parsedData.profileData,
            primaryAddress: {
                ...prev.profileData.primaryAddress,
                ...(parsedData.profileData.primaryAddress || {}),
            },
            mailingAddress: {
                ...(prev.profileData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }),
                ...(parsedData.profileData.mailingAddress || {}),
            },
        } : prev.profileData;

        const newEventData = parsedData.eventData ? {
            ...prev.eventData,
            ...parsedData.eventData,
        } : prev.eventData;

        return {
            ...prev,
            profileData: newProfileData,
            eventData: newEventData,
        };
    });
  };
  
  const handleFinalSubmit = async () => {
    await onSubmit(formData);
  };

  const renderStep = () => {
      switch(step) {
          case 1:
              return <ApplyContactPage 
                formData={formData.profileData} 
                updateFormData={updateProfileData} 
                nextStep={nextStep}
                onAIParsed={handleAIParsedData}
                />;
          case 2:
              return <ApplyEventPage formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} />;
          case 3:
              return <ApplyExpensesPage userProfile={userProfile} formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} />;
          case 4:
              return <ApplyTermsPage formData={formData.agreementData} updateFormData={updateAgreementData} prevStep={prevStep} onSubmit={handleFinalSubmit} />;
          default:
            navigate('home');
            return null;
      }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Apply for Relief</h1>
          {userProfile ? (
            <div className="mt-2 flex flex-col items-center gap-2">
                {userProfile.fundName && userProfile.fundCode ? (
                    <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                ) : null }
                <EligibilityIndicator 
                    cvStatus={userProfile.classVerificationStatus} 
                    onClick={() => navigate('classVerification')} 
                />
            </div>
          ) : (
            <p className="text-lg text-gray-400 mt-2 italic">No active fund selected.</p>
          )}
        </div>
      </div>
      <div>
        {renderStep()}
      </div>
    </div>
  );
};

export default ApplyPage;
