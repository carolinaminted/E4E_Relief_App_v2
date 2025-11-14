import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyModal from './PolicyModal';
import { ApplyIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon } from './Icons';
import type { Page, UserProfile, ClassVerificationStatus } from '../types';

interface HomePageProps {
  navigate: (page: Page) => void;
  canApply: boolean;
  userProfile: UserProfile;
  onAddIdentity: (fundCode: string) => void;
}

// --- Component ---

interface Tile {
  key: string;
  titleKey: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltipKey?: string;
  colSpan?: string;
}

const EligibilityIndicator: React.FC<{ cvStatus: ClassVerificationStatus, onClick: () => void }> = ({ cvStatus, onClick }) => {
    const { t } = useTranslation();
    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors";
    const passedClasses = "bg-green-800/50 text-green-300";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 cursor-pointer hover:bg-yellow-800/80";

    const handleClick = () => {
        if (!hasPassedCV) {
             console.log("[Telemetry] verification_needed_cta_clicked_from_home_page");
             onClick();
        }
    };

    const text = hasPassedCV ? t('applyPage.eligibility') : t('applyPage.verificationNeeded');
    
    return (
        <button
            onClick={handleClick}
            disabled={hasPassedCV}
            role={hasPassedCV ? 'status' : 'button'}
            aria-label={text}
            className={`${baseClasses} ${hasPassedCV ? passedClasses : neededClasses}`}
        >
            {!hasPassedCV && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            )}
            <span>{text}</span>
        </button>
    );
};


const HomePage: React.FC<HomePageProps> = ({ navigate, canApply, userProfile, onAddIdentity }) => {
    const { t } = useTranslation();
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

    const tiles: Tile[] = [
        { 
            key: 'apply', 
            titleKey: 'nav.apply', 
            icon: <ApplyIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('apply'),
            disabled: !canApply,
            disabledTooltipKey: userProfile.classVerificationStatus !== 'passed' ? "homePage.applyTooltipVerification" : "homePage.applyTooltipLimits"
        },
        { key: 'profile', titleKey: 'nav.profile', icon: <ProfileIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('profile') },
        { key: 'support', titleKey: 'nav.support', icon: <SupportIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('support') },
        { key: 'donate', titleKey: 'nav.donate', icon: <DonateIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('donate') },
    ];

    if (userProfile.role === 'Admin') {
        tiles.push({ 
            key: 'fundPortal', 
            titleKey: 'nav.fundPortal', 
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
                {t('homePage.title')}
            </h1>
            {userProfile ? (
              <div className="mt-2 flex flex-col items-center gap-2">
                  {userProfile.fundName && userProfile.fundCode ? (
                      <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                  ) : null }
                  <EligibilityIndicator 
                      cvStatus={userProfile.classVerificationStatus} 
                      onClick={() => onAddIdentity(userProfile.fundCode)} 
                  />
              </div>
            ) : (
              <p className="text-lg text-gray-400 mt-2 italic">{t('applyPage.noActiveFund')}</p>
            )}
          </div>

          <div className={`w-full max-w-md sm:max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-6`}>
            {tiles.map((tile) => (
                <div 
                    key={tile.key}
                    onClick={!tile.disabled ? tile.onClick : undefined}
                    title={tile.disabled && tile.disabledTooltipKey ? t(tile.disabledTooltipKey) : ""}
                    aria-disabled={!!tile.disabled}
                    className={`bg-[#004b8d]/50 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center justify-center text-center ${
                        tile.disabled ? 'opacity-60 cursor-not-allowed' : 'md:hover:bg-[#005ca0]/80 cursor-pointer md:hover:scale-105'
                    } ${tile.colSpan || ''}`}
                >
                    {tile.icon}
                    <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        {t(tile.titleKey)}
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
            {t('homePage.poweredBy')}
          </button>
        </div>
      </div>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default HomePage;