import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  const { t, i18n } = useTranslation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langDropdownRef]);

  const changeLanguage = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  return (
    <header className="flex md:hidden items-center justify-between w-full h-20 bg-[#003a70] px-4 flex-shrink-0 z-30">
      <div className="relative" ref={langDropdownRef}>
        <button
          onClick={() => setIsLangDropdownOpen(prev => !prev)}
          className="transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1"
          aria-label="Select language"
          aria-haspopup="true"
          aria-expanded={isLangDropdownOpen}
        >
          <img
            src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
            alt="E4E Relief Logo"
            className="h-11 w-auto"
          />
        </button>

        {isLangDropdownOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-[#004b8d] border border-[#005ca0] rounded-md shadow-lg z-50 py-1">
            <button
              onClick={() => changeLanguage('en')}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                i18n.language.startsWith('en')
                  ? 'text-[#ff8400] font-bold'
                  : 'text-white hover:bg-[#005ca0]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('es')}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                i18n.language.startsWith('es')
                  ? 'text-[#ff8400] font-bold'
                  : 'text-white hover:bg-[#005ca0]'
              }`}
            >
              Español
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-1 text-gray-200 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1"
            aria-haspopup="true"
            aria-expanded={isUserDropdownOpen}
          >
            <span className="text-base truncate max-w-[150px]">{t('nav.welcome', { name: userName })}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full min-w-[120px] bg-[#004b8d] border border-[#005ca0] rounded-md shadow-lg z-50 py-1">
              <button
                onClick={() => {
                  onLogout();
                  setIsUserDropdownOpen(false); // Close dropdown on click
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