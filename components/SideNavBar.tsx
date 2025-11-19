import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon, ApplyIcon, SparklesIcon } from './Icons';
import type { Page, EligibilityStatus, ClassVerificationStatus } from '../types';
import LanguageSwitcher from './LanguageSwitcher';
import EligibilityIndicator from './EligibilityIndicator';
import EligibilityInfoModal from './EligibilityInfoModal';

interface SideNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
  userName: string;
  onLogout: () => void;
  canApply: boolean;
  eligibilityStatus: EligibilityStatus;
  cvStatus: ClassVerificationStatus;
  supportedLanguages?: string[];
}

interface NavItemType {
  page: Page;
  labelKey: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isActive: boolean; disabled?: boolean }> = ({ icon, label, onClick, isActive, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center w-full p-3 my-1 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] ${
      isActive ? 'bg-[#ff8400]/30 text-white border border-[#ff8400]/50' : 'text-gray-200 hover:bg-[#005ca0]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
     aria-current={isActive ? 'page' : undefined}
  >
    <div className="w-6 h-6 mr-3">{icon}</div>
    <span>{label}</span>
  </button>
);

const SideNavBar: React.FC<SideNavBarProps> = ({ navigate, currentPage, userRole, userName, onLogout, canApply, eligibilityStatus, cvStatus, supportedLanguages = ['en'] }) => {
  const { t } = useTranslation();
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  
  const isEligible = eligibilityStatus === 'Eligible';
  const eligibilityMessage = isEligible
    ? t('eligibilityIndicator.eligibleMessage')
    : t('eligibilityIndicator.verificationNeededMessage');

  const handleEligibilityClick = () => {
    setIsEligibilityModalOpen(true);
  };

  const baseNavItems: NavItemType[] = [
    { page: 'home', labelKey: 'nav.home', icon: <HomeIcon className="h-6 w-6" /> },
    { page: 'profile', labelKey: 'nav.profile', icon: <ProfileIcon className="h-6 w-6" /> },
    { page: 'apply', labelKey: 'nav.apply', icon: <ApplyIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'aiApply', labelKey: 'nav.aiApply', icon: <SparklesIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'support', labelKey: 'nav.support', icon: <SupportIcon className="h-6 w-6" /> },
    { page: 'donate', labelKey: 'nav.donate', icon: <DonateIcon className="h-6 w-6" /> },
  ];

  const navItems = [...baseNavItems];
  if (userRole === 'Admin') {
    navItems.push({ page: 'fundPortal', labelKey: 'nav.fundPortal', icon: <DashboardIcon className="h-6 w-6" /> });
  }

  const adminDashboardPages: Page[] = ['fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails', 'liveDashboard'];
  const activePage = userRole === 'Admin' && adminDashboardPages.includes(currentPage) ? 'fundPortal' : currentPage;


  return (
    <>
      <nav className="hidden md:flex flex-col w-64 bg-[#003a70] border-r border-[#002a50] p-4">
        <div className="mb-6 text-center">
            <div className="flex justify-center items-center mb-4">
                <img
                  src="https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy"
                  alt="E4E Relief Logo"
                  className="h-12 w-auto"
                />
            </div>
            <div className="p-2 flex flex-col items-center">
              <span className="text-gray-200 truncate">{t('nav.welcome', { name: userName })}</span>
              <div className="mt-1">
                  <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} onClick={handleEligibilityClick} />
              </div>
            </div>
             <div className="mt-4 px-2 space-y-2">
                <LanguageSwitcher variant="sideNav" supportedLanguages={supportedLanguages} />
                <button
                    onClick={onLogout}
                    className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('nav.logout')}</span>
                </button>
            </div>
        </div>

        <div className="flex-grow border-t border-[#002a50] pt-4">
          {navItems.map(item => (
            <NavItem
              key={item.page}
              label={t(item.labelKey)}
              icon={item.icon}
              onClick={() => navigate(item.page as Page)}
              isActive={activePage === item.page}
              disabled={item.disabled}
            />
          ))}
        </div>
        
      </nav>
      {isEligibilityModalOpen && (
        <EligibilityInfoModal message={eligibilityMessage} onClose={() => setIsEligibilityModalOpen(false)} />
      )}
    </>
  );
};

export default SideNavBar;