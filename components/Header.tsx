import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

type Page = 'home';

interface HeaderProps {
  navigate: (page: Page) => void;
  userName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ navigate, userName, onLogout }) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="flex md:hidden items-center justify-between w-full h-20 bg-[#003a70] px-4 flex-shrink-0 z-30">
      <button onClick={() => navigate('home')} className="transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
        <img
          src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
          alt="E4E Relief Logo"
          className="h-11 w-auto"
        />
      </button>
      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="header" />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 text-gray-200 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <span className="text-base truncate max-w-[100px]">{t('nav.welcome', { name: userName })}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full min-w-[120px] bg-[#004b8d] border border-[#005ca0] rounded-md shadow-lg z-50 py-1">
              <button
                onClick={() => {
                  onLogout();
                  setIsDropdownOpen(false); // Close dropdown on click
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-[#ff8400]/20 hover:text-red-200 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;