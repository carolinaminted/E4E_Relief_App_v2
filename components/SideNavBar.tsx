import React from 'react';
import { HomeIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon, ApplyIcon } from './Icons';
// FIX: Use the centralized Page type from types.ts to ensure all navigation values are covered, including 'login' and 'register'.
import type { Page } from '../types';

interface SideNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
  userName: string;
  onLogout: () => void;
  canApply: boolean;
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
    className={`flex items-center w-full p-3 my-1 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] ${
      isActive ? 'bg-[#ff8400]/30 text-white border border-[#ff8400]/50' : 'text-gray-200 hover:bg-[#005ca0]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
     aria-current={isActive ? 'page' : undefined}
  >
    <div className="w-6 h-6 mr-3">{icon}</div>
    <span>{label}</span>
  </button>
);

const SideNavBar: React.FC<SideNavBarProps> = ({ navigate, currentPage, userRole, userName, onLogout, canApply }) => {
  const baseNavItems: NavItemType[] = [
    { page: 'home', label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
    { page: 'profile', label: 'Profile', icon: <ProfileIcon className="h-6 w-6" /> },
    { page: 'apply', label: 'Apply', icon: <ApplyIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'support', label: 'Support', icon: <SupportIcon className="h-6 w-6" /> },
    { page: 'donate', label: 'Donate', icon: <DonateIcon className="h-6 w-6" /> },
  ];

  const navItems = [...baseNavItems];
  if (userRole === 'Admin') {
    navItems.push({ page: 'fundPortal', label: 'Fund Portal', icon: <DashboardIcon className="h-6 w-6" /> });
  }

  // If admin is on any portal page, highlight 'Fund Portal'
  const adminDashboardPages: Page[] = ['dashboard', 'fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails', 'liveDashboard'];
  const activePage = userRole === 'Admin' && adminDashboardPages.includes(currentPage) ? 'fundPortal' : currentPage;


  return (
      <nav className="hidden md:flex flex-col w-64 bg-[#003a70] border-r border-[#002a50] p-4">
        <div className="mb-6">
            <div className="flex items-center mb-4">
                <button onClick={() => navigate('home')} className="flex-shrink-0 transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
                    <img
                        src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
                        alt="E4E Relief Logo"
                        className="h-12 w-auto"
                    />
                </button>
                <div className="flex-1 flex justify-center items-center min-w-0">
                    <span className="text-gray-200 truncate pl-2">Welcome, {userName}</span>
                </div>
            </div>
            <button onClick={onLogout} className="bg-[#ff8400]/20 hover:bg-[#ff8400]/40 text-[#ffc88a] font-semibold py-2 w-full rounded-md text-sm transition-colors duration-200">
              Logout
            </button>
        </div>
        <div className="flex-grow">
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
        </div>
      </nav>
  );
};

export default SideNavBar;
