
import React from 'react';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'donate' | 'eligibility';

interface HomePageProps {
  navigate: (page: Page) => void;
  isApplyEnabled: boolean;
  fundName?: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigate, isApplyEnabled, fundName }) => {
  const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; className?: string, disabled?: boolean }> = ({ title, description, onClick, className = '', disabled = false }) => (
    <div 
      className={`bg-[#004b8d] p-6 rounded-lg shadow-lg transition-all duration-300 transform ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#005ca0]/50 cursor-pointer hover:scale-105'} ${className}`}
      onClick={!disabled ? onClick : undefined}
      title={disabled ? "Class Verification required to access applications." : ""}
      aria-disabled={disabled}
    >
      <h2 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2 ${disabled ? 'opacity-70' : ''}`}>{title}</h2>
      <p className="text-white">{description}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 pb-16 px-8 text-center">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-12">
        Welcome to {fundName || 'E4E Relief'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <ActionCard title="Apply for Relief" description="Submit a new application for financial assistance." onClick={() => navigate('apply')} className="md:col-span-2" disabled={!isApplyEnabled} />
        <ActionCard title="Eligible for Assistance?" description="Check which events and eligibility types your program covers." onClick={() => navigate('eligibility')} />
        <ActionCard title="Profile" description="View your application history and manage your contact information." onClick={() => navigate('profile')} />
        <ActionCard title="Support" description="Find contact information and answers to frequently asked questions." onClick={() => navigate('support')} />
        <ActionCard title="Donate" description="Support our cause and help others in need." onClick={() => navigate('donate')} />
        <ActionCard 
            title="Token Usage" 
            description="AI model token consumption dashboard & token usage reports" 
            onClick={() => navigate('tokenUsage')} 
            className="md:col-span-2"
        />
      </div>
    </div>
  );
};

export default HomePage;