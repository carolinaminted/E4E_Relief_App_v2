import React from 'react';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'donate' | 'eligibility' | 'fundPortal';

interface HomePageProps {
  navigate: (page: Page) => void;
  isApplyEnabled: boolean;
  fundName?: string;
  userRole: 'User' | 'Admin';
}

// --- Custom SVG Icons with Orange Gradient ---
const IconDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#ff8400' }} />
        <stop offset="100%" style={{ stopColor: '#edda26' }} />
      </linearGradient>
    </defs>
  </svg>
);

const ApplyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
  </svg>
);

const EligibilityIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SupportIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DonateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const FundPortalIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const TokenUsageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

// --- Component ---

const HomePage: React.FC<HomePageProps> = ({ navigate, isApplyEnabled, fundName, userRole }) => {
  const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; icon: React.ReactNode; className?: string, disabled?: boolean }> = ({ title, description, onClick, icon, className = '', disabled = false }) => (
    <div 
      className={`bg-[#004b8d] p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center text-center ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#005ca0]/50 cursor-pointer hover:scale-105'} ${className}`}
      onClick={!disabled ? onClick : undefined}
      title={disabled ? "Class Verification required to access applications." : ""}
      aria-disabled={disabled}
    >
      {icon}
      <h2 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2 ${disabled ? 'opacity-70' : ''}`}>{title}</h2>
      <p className="text-white text-sm">{description}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 pb-16 px-8 text-center">
      <IconDefs />
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-12">
        Welcome to {fundName || 'E4E Relief'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <ActionCard icon={<ApplyIcon />} title="Apply for Relief" description="Submit a new application for financial assistance." onClick={() => navigate('apply')} className="lg:col-span-3" disabled={!isApplyEnabled} />
        <ActionCard icon={<EligibilityIcon />} title="Eligible for Assistance?" description="Check which events and eligibility types your program covers." onClick={() => navigate('eligibility')} />
        <ActionCard icon={<ProfileIcon />} title="Profile" description="View your application history and manage your contact information." onClick={() => navigate('profile')} />
        <ActionCard icon={<SupportIcon />} title="Support" description="Find contact information and answers to frequently asked questions." onClick={() => navigate('support')} />
        <ActionCard icon={<DonateIcon />} title="Donate" description="Support our cause and help others in need." onClick={() => navigate('donate')} />
        
        {userRole === 'Admin' ? (
          <>
            <ActionCard 
                icon={<FundPortalIcon />}
                title="Fund Portal" 
                description="Access fund management tools and analytics." 
                onClick={() => navigate('fundPortal')} 
            />
            <ActionCard 
                icon={<TokenUsageIcon />}
                title="Token Usage" 
                description="AI model token consumption dashboard & token usage reports" 
                onClick={() => navigate('tokenUsage')} 
            />
          </>
        ) : (
           <ActionCard 
            icon={<TokenUsageIcon />}
            title="Token Usage" 
            description="AI model token consumption dashboard & token usage reports" 
            onClick={() => navigate('tokenUsage')} 
            className="md:col-span-2 lg:col-span-1"
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;