import React from 'react';
// FIX: Use the centralized Page type from types.ts to ensure all navigation values are covered.
import type { UserProfile, Page } from '../types';

interface FundPortalPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

// --- Reusable Tile Data Structure ---
interface PortalTile {
  key: Page;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
}


// --- Icons ---
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

const DashboardIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const LiveDashboardIcon: React.FC<{ className?: string }> = ({ className = "h-12 w-12 mb-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path stroke="url(#icon-gradient)" strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l3-3l3 3l3-3l3 3l3-3" />
        <circle cx="20" cy="4" r="2" fill="#ff8400" stroke="none" />
    </svg>
);

const TicketingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H3a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 3 4.5Z" />
    </svg>
);

const ProgramDetailsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2-2Z" />
    </svg>
);

const ProxyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" transform="translate(6, -4)" opacity="0.6"/>
    </svg>
);

const TokenUsageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="url(#icon-gradient)" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


const FundPortalPage: React.FC<FundPortalPageProps> = ({ navigate, user }) => {
  /**
   * Defines the navigation tiles for the admin portal.
   * Storing this in an array makes it easy to manage and render the grid,
   * especially for handling layouts with an odd number of items.
   */
  const portalTiles: PortalTile[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      onClick: () => navigate('dashboard'),
      icon: <DashboardIcon />,
    },
    {
      key: 'liveDashboard',
      title: 'Live Dashboard',
      onClick: () => navigate('liveDashboard'),
      icon: <LiveDashboardIcon />,
    },
    {
      key: 'ticketing',
      title: 'Ticketing',
      onClick: () => navigate('ticketing'),
      icon: <TicketingIcon />,
    },
    {
      key: 'programDetails',
      title: 'Details',
      onClick: () => navigate('programDetails'),
      icon: <ProgramDetailsIcon />,
    },
    {
      key: 'proxy',
      title: 'Proxy',
      onClick: () => navigate('proxy'),
      icon: <ProxyIcon />,
    },
    {
      key: 'tokenUsage',
      title: 'Tokens',
      onClick: () => navigate('tokenUsage'),
      icon: <TokenUsageIcon />,
    },
  ];
  
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
          <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                Fund Portal
            </h1>
            <p className="text-xl font-semibold text-white mt-1">{user.fundName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-12 max-w-2xl mx-auto">
          <IconDefs />
          {portalTiles.map((tile, index) => {
            // This logic checks if the current tile is the last one in the list AND if the total number of tiles is odd.
            // If so, it applies a `col-span-2` class to make the last tile span the full width of the grid,
            // creating a more balanced and visually appealing layout.
            const isLastAndOdd = (index === portalTiles.length - 1) && (portalTiles.length % 2 !== 0);
            const colSpanClass = isLastAndOdd ? 'col-span-2' : '';

            return (
              <div 
                key={tile.key}
                onClick={tile.onClick}
                className={`bg-[#004b8d]/50 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-lg hover:bg-[#005ca0]/80 transition-all duration-300 cursor-pointer flex flex-col items-center text-center ${colSpanClass}`}
              >
                {tile.icon}
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{tile.title}</h2>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

export default FundPortalPage;
