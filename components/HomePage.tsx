import React, { useState } from 'react';
import PolicyModal from './PolicyModal';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'donate' | 'fundPortal';

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

const DashboardIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

// --- Component ---

const HomePage: React.FC<HomePageProps> = ({ navigate, isApplyEnabled, fundName, userRole }) => {
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

    const tiles = [
        { 
            key: 'apply', 
            title: 'Apply', 
            icon: <ApplyIcon />, 
            onClick: () => navigate('apply'),
            disabled: !isApplyEnabled,
            disabledTooltip: "Class Verification required to access applications."
        },
        { key: 'profile', title: 'Profile', icon: <ProfileIcon />, onClick: () => navigate('profile') },
        { key: 'support', title: 'Support', icon: <SupportIcon />, onClick: () => navigate('support') },
        { key: 'donate', title: 'Donate', icon: <DonateIcon />, onClick: () => navigate('donate') },
    ];

    if (userRole === 'Admin') {
        tiles.push({ key: 'dashboards', title: 'Dashboards', icon: <DashboardIcon />, onClick: () => navigate('fundPortal') });
    }

  return (
    <div className="flex-1 flex flex-col items-center justify-between pt-12 md:pt-16 pb-8 px-4 sm:px-8 text-center">
      <div> {/* Content wrapper */}
        <IconDefs />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
          Welcome to {fundName || 'E4E Relief'}
        </h1>

        <div className={`w-full max-w-4xl mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6`}>
          {tiles.map((tile) => (
              <div 
                  key={tile.key}
                  onClick={!tile.disabled ? tile.onClick : undefined}
                  title={tile.disabled ? tile.disabledTooltip : ""}
                  aria-disabled={!!tile.disabled}
                  className={`bg-[#004b8d] p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center text-center ${
                      tile.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#005ca0]/50 cursor-pointer hover:scale-105'
                  }`}
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