import React from 'react';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate';

interface SupportPageProps {
  navigate: (page: Page) => void;
  openChatbot: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ navigate, openChatbot }) => {
  
  const SubActionCard: React.FC<{ title: string; description: string; onClick: () => void; }> = ({ title, description, onClick }) => (
    <div 
      className="bg-[#004b8d] p-6 rounded-lg shadow-lg hover:bg-[#005ca0]/50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
      onClick={onClick}
    >
      <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2">{title}</h2>
      <p className="text-white text-sm">{description}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
          <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
            Support Center
          </h1>
        </div>
        
        {/* Main Contact Card */}
        <div className="bg-[#004b8d] p-8 rounded-lg shadow-2xl max-w-2xl mx-auto border border-[#005ca0]/50">
          <div className="bg-[#003a70]/50 p-6 rounded-lg space-y-6 text-center">
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Email</h3>
              <a href="mailto:support@e4erelief.example" className="font-semibold text-white hover:underline text-lg">support@e4erelief.example</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Phone</h3>
              <a href="tel:800-555-0199" className="font-semibold text-white hover:underline text-lg">(800) 555-0199</a>
            </div>
            <div>
              <button 
                onClick={openChatbot}
                className="bg-transparent border border-[#ff8400] text-[#ff8400] hover:bg-[#ff8400]/20 font-semibold py-2 px-6 rounded-md transition-colors duration-200"
              >
                Talk to Relief Assistant
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">Relief Assistant uses AI. Call or email us with any additional questions.</p>
        </div>

        {/* Secondary Tiles */}
        <div className="grid grid-cols-2 gap-6 w-full mt-12 max-w-4xl mx-auto">
          <SubActionCard 
            title="FAQs" 
            description="Find answers to common questions." 
            onClick={() => navigate('faq')} 
          />
          <SubActionCard 
            title="Payment Options" 
            description="Learn how grants are disbursed." 
            onClick={() => navigate('paymentOptions')} 
          />
        </div>
        
      </div>
    </div>
  );
};

export default SupportPage;