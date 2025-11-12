import React from 'react';

type Page = 'home';

interface HeaderProps {
  navigate: (page: Page) => void;
  userName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ navigate, userName, onLogout }) => {
  return (
    <header className="flex md:hidden items-center justify-between w-full h-16 bg-[#003a70] px-4 flex-shrink-0 z-30">
      <button onClick={() => navigate('home')} className="transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
        <img
          src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
          alt="E4E Relief Logo"
          className="h-11 w-auto"
        />
      </button>
      <div className="flex items-center gap-4">
        <span className="text-gray-200 text-base truncate">Welcome, {userName}</span>
        <button onClick={onLogout} className="bg-[#ff8400]/50 hover:bg-[#ff8400]/80 text-white font-semibold py-1.5 px-4 rounded-md text-sm transition-colors duration-200">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;