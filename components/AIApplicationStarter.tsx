
import React, { useState } from 'react';
import type { ApplicationFormData } from '../types';

interface AIApplicationStarterProps {
  onParse: (description: string) => Promise<void>;
  isLoading: boolean;
  variant?: 'boxed' | 'underline';
}

const AIApplicationStarter: React.FC<AIApplicationStarterProps> = ({ onParse, isLoading, variant = 'boxed' }) => {
  const [descriptionInput, setDescriptionInput] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleParse = async () => {
    if (!descriptionInput.trim()) {
      setError('Please describe your situation to get started.');
      return;
    }
    setError('');
    setIsSuccess(false);
    try {
      await onParse(descriptionInput);
      setDescriptionInput(''); 
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000); // Clear after 5 seconds
    } catch (e) {
      console.error("AIApplicationStarter caught error during parse:", e);
      setError('Could not extract details. Please try again or fill fields manually.');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionInput(e.target.value);
    if (error) setError('');
    if (isSuccess) setIsSuccess(false);
  };
  
  const textareaClasses = {
    boxed: "w-full bg-[#005ca0] border border-[#005ca0] rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff8400] focus:border-[#ff8400]",
    underline: "w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#ff8400]"
  };

  return (
    <div className="bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
      <p className="text-sm text-white mb-2">
        Describe your situation below and our AI relief Assistant will pre-fill your application.
      </p>
      <div className="flex flex-col md:flex-row md:items-end gap-2">
        <textarea
          id="ai-starter-input"
          value={descriptionInput}
          onChange={handleInputChange}
          placeholder="e.g., I'm a homeowner affected by the recent tornado in Anytown, CA. My home was damaged and I need about $2500 for repairs. Our household of 4 makes about $60k/year. My phone is 555-123-4567 and I prefer to communicate in Spanish."
          rows={6}
          className={textareaClasses[variant]}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={isLoading || !descriptionInput.trim()}
          className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-wait min-w-[80px] flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             "Submit Description"
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2" role="alert">{error}</p>}
      {isSuccess && <p className="text-green-400 text-xs mt-2" role="status">Success! We've pre-filled the form with any details we found.</p>}
    </div>
  );
};

export default AIApplicationStarter;
