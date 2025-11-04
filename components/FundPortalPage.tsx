import React from 'react';
import type { UserProfile } from '../types';

type Page = 'home' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

interface FundPortalPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

// --- Icons ---
const DashboardIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TicketingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2H5z" />
    </svg>
);

const ProgramDetailsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ProxyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);


const FundPortalCard: React.FC<{ title: string; description: string; onClick: () => void; icon: React.ReactNode }> = ({ title, description, onClick, icon }) => (
  <div 
    onClick={onClick}
    className="bg-[#004b8d] p-6 rounded-lg shadow-lg hover:bg-[#005ca0]/50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
  >
    {icon}
    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2">{title}</h2>
    <p className="text-white text-sm">{description}</p>
  </div>
);

const FundPortalPage: React.FC<FundPortalPageProps> = ({ navigate, user }) => {
  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
          <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                {user.fundName}
            </h1>
            <p className="text-xl font-semibold text-white mt-1">Fund Portal</p>
          </div>
        </div>
        
        <p className="text-center text-white mb-12 max-w-2xl mx-auto">
            Welcome, {user.firstName}. Access fund management tools and analytics below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-12 max-w-4xl mx-auto">
          <FundPortalCard 
            title="Dashboard" 
            description="Shows fund analytics, metrics, and reports." 
            onClick={() => navigate('dashboard')}
            icon={<DashboardIcon />}
          />
          <FundPortalCard 
            title="Ticketing" 
            description="Access and manage support or case tickets." 
            onClick={() => navigate('ticketing')} 
            icon={<TicketingIcon />}
          />
          <FundPortalCard 
            title="Program Details" 
            description="Displays fund parameters, eligibility criteria, and limits." 
            onClick={() => navigate('programDetails')} 
            icon={<ProgramDetailsIcon />}
          />
          <FundPortalCard 
            title="Proxy" 
            description="Submit applications on behalf of employees." 
            onClick={() => navigate('proxy')} 
            icon={<ProxyIcon />}
          />
        </div>
        
      </div>
    </div>
  );
};

export default FundPortalPage;