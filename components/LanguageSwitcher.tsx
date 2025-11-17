import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  // Defines the visual style of the switcher.
  variant?: 'header' | 'sideNav';
}

/**
 * A reusable component that allows the user to switch the application's language
 * between English ('en') and Spanish ('es'). It uses the `i18n` instance from
 * `react-i18next` to change the language globally.
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng);
  };

  const activeClasses = 'font-bold text-[#ff8400]';
  const inactiveClasses = 'text-gray-300 hover:text-white';
  const baseClasses = 'px-2 py-1 text-sm transition-colors';

  // The 'sideNav' variant has a distinct background and is used in the desktop sidebar.
  if (variant === 'sideNav') {
    return (
        <div className="flex items-center justify-center gap-2 p-2 bg-[#004b8d]/50 rounded-md">
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

  // The default 'header' variant is simpler and used on the login/register pages.
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