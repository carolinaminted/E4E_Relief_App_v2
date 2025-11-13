import React, { useState } from 'react';
import PolicyModal from './PolicyModal';
import { ApplyIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon } from './Icons';
import type { Page } from '../types';


interface HomePageProps {
  navigate: (page: Page) => void;
  isVerifiedAndEligible: boolean;
  canApply: boolean;
  fundName?: string;
  userRole: 'User' | 'Admin';
}

// --- Component ---

interface Tile {
  key: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  colSpan?: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigate, isVerifiedAndEligible, canApply, fundName, userRole }) => {
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

    const tiles: Tile[] = [
        { 
            key: 'apply', 
            title: 'Apply', 
            icon: <ApplyIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('apply'),
            disabled: !canApply,
            disabledTooltip: !isVerifiedAndEligible ? "Class Verification required to access applications." : "Your grant limits have been reached."
        },
        { key: 'profile', title: 'Profile', icon: <ProfileIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('profile') },
        { key: 'support', title: 'Support', icon: <SupportIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('support') },
        { key: 'donate', title: 'Donate', icon: <DonateIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('donate') },
    ];

    if (userRole === 'Admin') {
        tiles.push({ 
            key: 'fundPortal', 
            title: 'Fund Portal', 
            icon: <DashboardIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('fundPortal'),
            colSpan: 'col-span-2'
        });
    }

  return (
    <>
      <div className="flex-1 flex flex-col items-center p-4 md:p-8 text-center">
        <div className="w-full flex-grow flex flex-col items-center"> {/* Content wrapper */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                Home
            </h1>
            <p className="text-xl font-semibold text-white mt-1">{fundName || 'E4E Relief'}</p>
          </div>

          <div className={`w-full max-w-md sm:max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-6`}>
            {tiles.map((tile) => (
                <div 
                    key={tile.key}
                    onClick={!tile.disabled ? tile.onClick : undefined}
                    title={tile.disabled ? tile.disabledTooltip : ""}
                    aria-disabled={!!tile.disabled}
                    className={`bg-[#004b8d]/50 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center justify-center text-center ${
                        tile.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#005ca0]/80 cursor-pointer hover:scale-105'
                    } ${tile.colSpan || ''}`}
                >
                    {tile.icon}
                    <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        {tile.title}
                    </h2>
                </div>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 text-center">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="text-xs text-[#898c8d] hover:text-white transition-colors duration-200"
          >
            Powered by E4E Relief
          </button>
        </div>
      </div>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default HomePage;