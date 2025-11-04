import React, { useState } from 'react';
import type { Application, UserProfile, ApplicationFormData, EventData } from '../types';

// Import step components
import ApplyContactPage from './ApplyContactPage';
import ApplyEventPage from './ApplyEventPage';
import ApplyExpensesPage from './ApplyExpensesPage';
import ApplyTermsPage from './ApplyTermsPage';

interface ApplyPageProps {
  navigate: (page: 'home' | 'profile') => void;
  onSubmit: (application: ApplicationFormData) => Promise<void>;
  userProfile: UserProfile;
  applicationDraft: Partial<ApplicationFormData> | null;
}

const ApplyPage: React.FC<ApplyPageProps> = ({ navigate, onSubmit, userProfile, applicationDraft }) => {
  const [step, setStep] = useState(1);
  
  // Initialize state by deeply merging the user's profile with any draft data from the chatbot
  const [formData, setFormData] = useState<ApplicationFormData>(() => {
    // FIX: Cast draftProfile to Partial<UserProfile> to allow safe access to nested properties like primaryAddress
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

  const nextStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => prev + 1);
  };
  const prevStep = () => {
    window.scrollTo(0, 0);
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
              return <ApplyExpensesPage nextStep={nextStep} prevStep={prevStep} />;
          case 4:
              return <ApplyTermsPage formData={formData.agreementData} updateFormData={updateAgreementData} prevStep={prevStep} onSubmit={handleFinalSubmit} />;
          default:
            navigate('home');
            return null;
      }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-6">
        <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Apply for Relief</h1>
      </div>
      <div>
        {renderStep()}
      </div>
    </div>
  );
};

export default ApplyPage;