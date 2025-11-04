import React from 'react';
import type { Application } from '../types';

interface SubmissionSuccessPageProps {
  application: Application;
  onGoToProfile: () => void;
}

const SubmissionSuccessPage: React.FC<SubmissionSuccessPageProps> = ({ application, onGoToProfile }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="w-full max-w-2xl bg-[#004b8d] p-10 rounded-lg shadow-lg">
        <svg className="w-16 h-16 text-[#edda26] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">
          Submission Successful!
        </h1>
        <p className="text-white mb-2">Your application for relief has been received.</p>
        <div className="bg-[#005ca0] rounded-md px-4 py-2 my-6 inline-block">
          <p className="text-white opacity-80 text-sm">Your Application ID is:</p>
          <p className="text-white font-mono text-lg">{application.id}</p>
        </div>
        <p className="text-white max-w-sm mx-auto mb-8">
          You can track the status of your application in the "My Applications" section of your profile page.
        </p>
        <button
          onClick={onGoToProfile}
          className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
        >
          Go to My Profile
        </button>
      </div>
    </div>
  );
};

export default SubmissionSuccessPage;