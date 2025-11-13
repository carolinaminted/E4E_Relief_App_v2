import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC<{ variant?: 'header' | 'sideNav' }> = ({ variant = 'header' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng);
  };

  const activeClasses = 'font-bold text-[#ff8400]';
  const inactiveClasses = 'text-gray-300 hover:text-white';
  const baseClasses = 'px-2 py-1 text-sm transition-colors';

  if (variant === 'sideNav') {
    return (
        <div className="flex items-center justify-center gap-2 p-2 mt-4 bg-[#004b8d]/50 rounded-md">
            <button
                onClick={() => changeLanguage('en')}
                className={`${baseClasses} ${i18n.language.startsWith('en') ? activeClasses : inactiveClasses}`}
                aria-pressed={i18n.language.startsWith('en')}
            >
                EN
            </button>
            <div className="h-4 w-px bg-gray-500"></div>
            <button
                onClick={() => changeLanguage('es')}
                className={`${baseClasses} ${i18n.language.startsWith('es') ? activeClasses : inactiveClasses}`}
                aria-pressed={i18n.language.startsWith('es')}
            >
                ES
            </button>
        </div>
    )
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => changeLanguage('en')}
        className={`${baseClasses} ${i18n.language.startsWith('en') ? activeClasses : inactiveClasses}`}
        aria-pressed={i18n.language.startsWith('en')}
      >
        EN
      </button>
      <div className="h-4 w-px bg-gray-500"></div>
      <button
        onClick={() => changeLanguage('es')}
        className={`${baseClasses} ${i18n.language.startsWith('es') ? activeClasses : inactiveClasses}`}
        aria-pressed={i18n.language.startsWith('es')}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;
