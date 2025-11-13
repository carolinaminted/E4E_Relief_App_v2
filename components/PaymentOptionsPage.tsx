import React from 'react';

type Page = 'support';

interface PaymentOptionsPageProps {
  navigate: (page: Page) => void;
}

const internationalPartners = [
  {
    name: "Convera Guide",
    link: "https://www.e4erelief.org/convera-international-grant-payment-guide",
  },
  {
    name: "Tipalti Guide",
    link: "https://www.e4erelief.org/tipalti-international-grant-payment-guide",
  }
];

const PaymentOptionsPage: React.FC<PaymentOptionsPageProps> = ({ navigate }) => {
  
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('support')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Support Center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              Payment Options
            </h1>
        </div>
        <p className="text-center text-white mb-12 max-w-3xl mx-auto">We partner with industry-leading payment providers to ensure your relief funds are delivered quickly and securely, wherever you are in the world.</p>
        
        <div className="flex flex-col items-center gap-8">
            {/* US Applicants Section */}
            <div className="w-full bg-[#004b8d] p-8 rounded-lg shadow-2xl border border-[#005ca0]/50 flex flex-col text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4">
                    US Applicants
                </h2>
                <p className="text-white mb-6 max-w-md mx-auto">
                    For applicants within the United States, please review our payment guide to understand the available options and requirements for receiving your grant.
                </p>
                <a
                    href="https://www.bankofamerica.com/recipient-select/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#003a70]/50 p-4 rounded-lg hover:bg-[#005ca0]/50 transition-all duration-300 border-2 border-transparent hover:border-[#ff8400]/50 transform hover:scale-105 font-semibold text-white"
                >
                    Bank of America Recipient Select Guide
                </a>
            </div>
            
            {/* International Applicants Section */}
            <div className="w-full bg-[#004b8d] p-8 rounded-lg shadow-2xl border border-[#005ca0]/50 flex flex-col">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center">
                    International Applicants
                </h2>
                
                <div>
                    <h3 className="text-xl font-semibold text-white mt-6 mb-2 text-center">International Grant Award Payment Support</h3>
                    <p className="text-gray-300 text-center">
                        Once a grant is awarded, there are a few important registration steps you must complete before financial assistance is received. To receive this financial assistance, you must successfully complete your account registration with our payment partners. 
                        <a href="https://www.e4erelief.org/international-grant-award-guide" target="_blank" rel="noopener noreferrer" className="text-[#ff8400] hover:underline font-semibold"> Click here </a>
                        to review the international grant award guide.
                    </p>

                    <h3 className="text-xl font-semibold text-white mt-8 mb-4 text-center">Payment Partner Information</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                        {internationalPartners.map(partner => (
                        <a 
                            key={partner.name}
                            href={partner.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title={`View the ${partner.name}`}
                            className="bg-[#003a70]/50 p-4 rounded-lg hover:bg-[#005ca0]/50 transition-all duration-300 border-2 border-transparent hover:border-[#ff8400]/50 transform hover:scale-105 font-semibold text-white"
                        >
                            {partner.name}
                        </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;