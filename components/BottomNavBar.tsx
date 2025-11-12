import React from 'react';
import { HomeIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon } from './Icons';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

interface BottomNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
}

interface NavItemType {
  page: Page;
  label: string;
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

const BottomNavBar: React.FC<BottomNavBarProps> = ({ navigate, currentPage, userRole }) => {
  const baseNavItems: NavItemType[] = [
    { page: 'home', label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
    { page: 'profile', label: 'Profile', icon: <ProfileIcon className="h-6 w-6" /> },
    { page: 'support', label: 'Support', icon: <SupportIcon className="h-6 w-6" /> },
    { page: 'donate', label: 'Donate', icon: <DonateIcon className="h-6 w-6" /> },
  ];

  const navItems = [...baseNavItems];
  if (userRole === 'Admin') {
    navItems.push({ page: 'dashboard', label: 'Dashboards', icon: <DashboardIcon className="h-6 w-6" /> });
  }

  // If admin is on any portal page, highlight 'Dashboards'
  const adminDashboardPages: Page[] = ['dashboard', 'fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails'];
  const activePage = userRole === 'Admin' && adminDashboardPages.includes(currentPage) ? 'dashboard' : currentPage;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#003a70] border-t border-[#005ca0] flex md:hidden z-40">
      {navItems.map(item => (
        <NavItem
          key={item.page}
          label={item.label}
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