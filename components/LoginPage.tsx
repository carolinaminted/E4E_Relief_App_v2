import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  switchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, switchToRegister }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoAdmin = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('loginPage.errorGeneric'));
      return;
    }
    setIsLoading(true);
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError(t('loginPage.errorInvalid'));
      setIsLoading(false);
    }
    // On success, the App component will handle navigation
  };

  return (
    <div>
        <div 
            className="w-full flex justify-center items-center mb-6 sm:mb-8 cursor-pointer"
            onClick={handleDemoAdmin}
            title="Click to autofill admin credentials"
        >
            <img 
                src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi" 
                alt="E4E Relief Logo" 
                className="mx-auto h-32 sm:h-36 w-auto"
            />
        </div>
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">{t('loginPage.emailLabel')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">{t('loginPage.passwordLabel')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="h-6 text-center">
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-6 h-12 flex justify-center items-center disabled:bg-gray-500" disabled={isLoading}>
          {isLoading ? (
             <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : t('loginPage.signInButton')}
        </button>
        <p className="text-sm text-center text-white">
          {t('loginPage.noAccount')}{' '}
          <button type="button" onClick={switchToRegister} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
            {t('loginPage.signUpLink')}
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;