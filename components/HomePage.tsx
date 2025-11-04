import React from 'react';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'donate';

interface HomePageProps {
  navigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; className?: string }> = ({ title, description, onClick, className = '' }) => (
    <div 
      className={`bg-[#004b8d] p-6 rounded-lg shadow-lg hover:bg-[#005ca0]/50 transition-all duration-300 cursor-pointer hover:scale-105 transform ${className}`}
      onClick={onClick}
    >
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2">{title}</h2>
      <p className="text-white">{description}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 pb-16 px-8 text-center">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-12">
        Welcome to E4E Relief
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <ActionCard title="Apply for Relief" description="Submit a new application for financial assistance." onClick={() => navigate('apply')} className="md:col-span-2" />
        <ActionCard title="My Profile" description="View your application history and manage your contact information." onClick={() => navigate('profile')} />
        <ActionCard title="Get Support" description="Find contact information and answers to frequently asked questions." onClick={() => navigate('support')} />
        <ActionCard title="Donate Now" description="Support our cause and help others in need." onClick={() => navigate('donate')} />
        <ActionCard 
            title="View Token Usage" 
            description="Review AI model token consumption." 
            onClick={() => navigate('tokenUsage')} 
        />
      </div>
    </div>
  );
};

export default HomePage;