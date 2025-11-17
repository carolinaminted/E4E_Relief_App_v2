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

const SideNavBar: React.FC<SideNavBarProps> = ({ navigate, currentPage, userRole, userName, onLogout, canApply, eligibilityStatus, cvStatus }) => {
  const { t } = useTranslation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef]);
  
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
    { page: 'aiApply', labelKey: 'nav.aiApply', icon: <SparklesIcon className="h-6 w-6" /> },
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
            <div className="flex justify-center items-center mb-2">
                <img
                  src="https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy"
                  alt="E4E Relief Logo"
                  className="h-12 w-auto"
                />
            </div>
            <div className="relative text-center" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(prev => !prev)}
                className="w-full p-2 rounded-md hover:bg-[#004b8d] transition-colors flex flex-col items-center"
              >
                  <span className="text-gray-200 truncate">{t('nav.welcome', { name: userName })}</span>
                  <div className="mt-1 flex justify-center">
                      <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} onClick={handleEligibilityClick} />
                  </div>
              </button>
              
              {isUserDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-[#004b8d] border border-[#005ca0] rounded-md shadow-lg z-50 py-1">
                      <button
                          onClick={() => {
                              handleEligibilityClick();
                              setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#005ca0] flex justify-between items-center transition-colors"
                      >
                          <span>Status</span>
                          <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} />
                      </button>
                      <div className="border-t border-[#005ca0] my-1"></div>
                      <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-[#ff8400]/20 hover:text-red-200 transition-colors"
                      >
                          {t('nav.logout')}
                      </button>
                  </div>
              )}
            </div>
        </div>
        <div className="flex-grow">
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
        <div className="mt-auto">
          <LanguageSwitcher variant="sideNav" />
        </div>
      </nav>
      {isEligibilityModalOpen && (
        <EligibilityInfoModal message={eligibilityMessage} onClose={() => setIsEligibilityModalOpen(false)} />
      )}
    </>
  );
};

export default SideNavBar;