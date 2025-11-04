import React, { useState } from 'react';
import TermsModal from './TermsModal';
// FIX: Corrected the import path for ApplicationFormData. It should be imported from '../types' instead of a component file.
import type { ApplicationFormData } from '../types';
import RequiredIndicator from './RequiredIndicator';

interface ApplyTermsPageProps {
  formData: ApplicationFormData['agreementData'];
  updateFormData: (data: Partial<ApplicationFormData['agreementData']>) => void;
  prevStep: () => void;
  onSubmit: () => Promise<void>;
}

const ApplyTermsPage: React.FC<ApplyTermsPageProps> = ({ formData, updateFormData, prevStep, onSubmit }) => {
  const [termsViewed, setTermsViewed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setTermsViewed(true);
  };

  const handleUpdate = (data: Partial<ApplicationFormData['agreementData']>) => {
    updateFormData(data);
    if(error) setError('');
  };
  
  const handleFinalSubmit = async () => {
    if (formData.shareStory === null) {
      setError('Please indicate if you are willing to share your story.');
      return;
    }
    if (formData.receiveAdditionalInfo === null) {
      setError('Please indicate if you are interested in receiving additional information.');
      return;
    }
    if (!termsAgreed) {
      setError('You must agree to the Terms of Acceptance to submit your application.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    await onSubmit();
    // On success, the app will navigate away, so no need to reset loading state
  };

  return (
    <div className="space-y-8 p-8">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Agreements &amp; Submission</h2>
      
      {/* Share Your Story Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Share Your Story</h3>
        <div>
          <label className="flex items-center text-white mb-2">
            Would you be willing to share your story with your employer?
            <RequiredIndicator required isMet={formData.shareStory !== null} />
            </label>
          <p className="text-xs text-gray-400 mb-2 italic">*If yes, we will share your name and email address and your employer may contact you for additional information.</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="shareStory" checked={formData.shareStory === true} onChange={() => handleUpdate({ shareStory: true })} className="form-radio h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 focus:ring-[#ff8400]" />
              <span className="ml-2 text-white">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="shareStory" checked={formData.shareStory === false} onChange={() => handleUpdate({ shareStory: false })} className="form-radio h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 focus:ring-[#ff8400]" />
              <span className="ml-2 text-white">No</span>
            </label>
          </div>
        </div>
        <div>
          <label className="flex items-center text-white mb-2">
            Are you interested in receiving additional information on assistance beyond financial support?
            <RequiredIndicator required isMet={formData.receiveAdditionalInfo !== null} />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === true} onChange={() => handleUpdate({ receiveAdditionalInfo: true })} className="form-radio h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 focus:ring-[#ff8400]" />
              <span className="ml-2 text-white">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === false} onChange={() => handleUpdate({ receiveAdditionalInfo: false })} className="form-radio h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 focus:ring-[#ff8400]" />
              <span className="ml-2 text-white">No</span>
            </label>
          </div>
        </div>
      </section>

      {/* Terms of Acceptance Section */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Terms of Acceptance</h3>
        <div className="flex items-start">
          <input 
            id="terms" 
            type="checkbox" 
            checked={termsAgreed}
            onChange={(e) => {
                setTermsAgreed(e.target.checked)
                if (error) setError('');
            }}
            disabled={!termsViewed}
            className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1 disabled:opacity-50 disabled:cursor-not-allowed" 
          />
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className={`text-white ${!termsViewed ? 'opacity-60': ''}`}>
              I acknowledge and agree that checking this box serves as my electronic signature and confirms that I have read, understand, and agree to the
            </label>
            <div className="mt-1 flex items-center">
              <button type="button" onClick={handleOpenModal} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#004b8d] focus:ring-[#ff8400] rounded">
                Terms of Acceptance
              </button>
              <span className="text-white">.</span>
              <RequiredIndicator required isMet={termsAgreed} />
            </div>
            {!termsViewed && <p className="text-xs text-yellow-400 mt-1 italic">Please view the terms before agreeing.</p>}
          </div>
        </div>
      </section>
      
      {error && <p className="text-red-400 text-sm pt-2">{error}</p>}
      
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200">
          Back
        </button>
        <button 
          onClick={handleFinalSubmit}
          disabled={!termsAgreed || isSubmitting}
          className="w-40 bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-6 rounded-md transition-colors duration-200 flex justify-center items-center h-12 disabled:bg-[#898c8d] disabled:cursor-wait"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>

      {isModalOpen && <TermsModal onClose={handleModalClose} />}
    </div>
  );
};

export default ApplyTermsPage;