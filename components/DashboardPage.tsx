import React from 'react';

type Page = 'fundPortal';

interface DashboardPageProps {
  navigate: (page: Page) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
            <button onClick={() => navigate('fundPortal')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Dashboard</h1>
        </div>
        <div className="text-center bg-[#003a70]/50 p-12 rounded-lg border border-[#005ca0]">
            <p className="text-white text-lg">Dashboard content and analytics will be displayed here.</p>
            <p className="text-gray-400 mt-2">This is a placeholder for fund-specific metrics and reports.</p>
        </div>
    </div>
  );
};

export default DashboardPage;