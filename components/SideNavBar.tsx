import React, { useState } from 'react';
import { HomeIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon } from './Icons';
import PolicyModal from './PolicyModal';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

interface SideNavBarProps {
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
    className={`flex items-center w-full p-3 my-1 text-sm rounded-md transition-colors duration-200 ${
      isActive ? 'bg-[#ff8400] text-white' : 'text-gray-200 hover:bg-[#005ca0]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
     aria-current={isActive ? 'page' : undefined}
  >
    <div className="w-6 h-6 mr-3">{icon}</div>
    <span>{label}</span>
  </button>
);

const SideNavBar: React.FC<SideNavBarProps> = ({ navigate, currentPage, userRole }) => {
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

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
    <>
      <nav className="hidden md:flex flex-col w-64 bg-[#003a70] border-r border-[#005ca0] p-4">
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
        <div className="flex-shrink-0">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="text-sm italic text-[#898c8d] hover:text-white transition-colors duration-200"
          >
            Legal Information
          </button>
        </div>
      </nav>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default SideNavBar;