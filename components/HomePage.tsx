import React, { useState } from 'react';
import PolicyModal from './PolicyModal';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'donate' | 'eligibility' | 'fundPortal';

interface HomePageProps {
  navigate: (page: Page) => void;
  isApplyEnabled: boolean;
  fundName?: string;
  userRole: 'User' | 'Admin';
}

// --- Resizable SVG Icons with Orange Gradient ---
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

const ApplyIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EligibilityIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfileIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SupportIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DonateIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const FundPortalIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const TokenUsageIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
);


// --- Component ---

const HomePage: React.FC<HomePageProps> = ({ navigate, isApplyEnabled, fundName, userRole }) => {
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const tiles = [
    { key: 'eligibility', title: 'Eligibility', icon: <EligibilityIcon />, onClick: () => navigate('eligibility') },
    { key: 'profile', title: 'Profile', icon: <ProfileIcon />, onClick: () => navigate('profile') },
    { key: 'support', title: 'Support', icon: <SupportIcon />, onClick: () => navigate('support') },
    { key: 'donate', title: 'Donate', icon: <DonateIcon />, onClick: () => navigate('donate') },
  ];

  if (userRole === 'Admin') {
    tiles.push(
      { key: 'fundPortal', title: 'Portal', icon: <FundPortalIcon />, onClick: () => navigate('fundPortal') },
      { key: 'tokenUsage', title: 'Tokens', icon: <TokenUsageIcon />, onClick: () => navigate('tokenUsage') },
    );
  } else {
      tiles.push({ key: 'tokenUsage', title: 'Tokens', icon: <TokenUsageIcon />, onClick: () => navigate('tokenUsage') });
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between pt-12 md:pt-16 pb-8 px-4 sm:px-8 text-center">
      <div> {/* Content wrapper */}
        <IconDefs />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
          Welcome to {fundName || 'E4E Relief'}
        </h1>

        <div className="w-full max-w-4xl mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Apply Banner */}
          <div
              onClick={!isApplyEnabled ? undefined : () => navigate('apply')}
              title={!isApplyEnabled ? "Class Verification required to access applications." : ""}
              aria-disabled={!isApplyEnabled}
              className={`col-span-2 sm:col-span-3 bg-[#004b8d] p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col sm:flex-row items-center text-center sm:text-left ${
                  isApplyEnabled ? 'hover:bg-[#005ca0]/50 cursor-pointer hover:scale-105' : 'opacity-60 cursor-not-allowed'
              }`}
          >
              <ApplyIcon className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0" />
              <div className="mt-4 sm:mt-0 sm:ml-6">
                  <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] ${!isApplyEnabled ? 'opacity-70' : ''}`}>
                      Apply for Relief
                  </h2>
                  <p className="text-white text-sm mt-1">
                      Submit a new application for financial assistance.
                  </p>
              </div>
          </div>

          {/* Other Tiles */}
          {tiles.map((tile) => (
              <div 
                  key={tile.key}
                  onClick={tile.onClick}
                  className="bg-[#004b8d] p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center text-center hover:bg-[#005ca0]/50 cursor-pointer hover:scale-105"
              >
                  {tile.icon}
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                      {tile.title}
                  </h2>
              </div>
          ))}
        </div>
      </div>
      <footer className="mt-8">
        <button
          onClick={() => setIsPolicyModalOpen(true)}
          className="text-sm italic text-[#898c8d] hover:text-white transition-colors duration-200"
        >
          Powered by E4E Relief Copyright 2025
        </button>
      </footer>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </div>
  );
};

export default HomePage;