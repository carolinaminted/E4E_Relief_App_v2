import React from 'react';
import { useTranslation } from 'react-i18next';
import { HomeIcon, ProfileIcon, SupportIcon, DashboardIcon, ApplyIcon, SparklesIcon } from './Icons';
import type { Page } from '../types';

interface BottomNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
  canApply: boolean;
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
    className={`flex flex-col items-center justify-center flex-1 p-2 text-xs transition-colors duration-200 ${
      isActive ? 'text-[#ff8400]' : 'text-gray-300 hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ navigate, currentPage, userRole, canApply }) => {
  const { t } = useTranslation();

  const baseNavItems: NavItemType[] = [
    { page: 'home', labelKey: 'nav.home', icon: <HomeIcon className="h-6 w-6" /> },
    { page: 'profile', labelKey: 'nav.profile', icon: <ProfileIcon className="h-6 w-6" /> },
    { page: 'apply', labelKey: 'nav.apply', icon: <ApplyIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'aiApply', labelKey: 'nav.aiApply', icon: <SparklesIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'support', labelKey: 'nav.support', icon: <SupportIcon className="h-6 w-6" /> },
  ];

  const navItems = [...baseNavItems];
  if (userRole === 'Admin') {
    // A shorter label for the bottom nav
    navItems.push({ page: 'fundPortal', labelKey: 'nav.fundPortal', icon: <DashboardIcon className="h-6 w-6" /> });
  }

  // If admin is on any portal page, highlight 'Fund Portal'
  // FIX: Removed 'dashboard' as it is not a valid Page type.
  const adminDashboardPages: Page[] = ['fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails', 'liveDashboard'];
  const activePage = userRole === 'Admin' && adminDashboardPages.includes(currentPage) ? 'fundPortal' : currentPage;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#003a70] border-t border-[#005ca0] flex md:hidden z-40">
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
    </nav>
  );
};

export default BottomNavBar;