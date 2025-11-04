import React, { useEffect } from 'react';

type Page = 'support';

interface PaymentOptionsPageProps {
  navigate: (page: Page) => void;
}

const internationalPartners = [
  {
    name: "Convera",
    logo: "https://bronze-generous-halibut-259.mypinata.cloud/ipfs/bafkreigqwixd5fz6zxnvo77eoz2mi3bv7x2qyuswprcyhldseqmxuqns5q",
    description: "- Convera (formerly Western Union) Guide",
    link: "https://www.e4erelief.org/convera-international-grant-payment-guide",
  },
  {
    name: "Tipalti",
    logo: "https://bronze-generous-halibut-259.mypinata.cloud/ipfs/bafkreid4qymmxk4frxlehtn6rkygpiwtbesfzokvmzxind7ttuemog2cx4",
    description: "- Tipalti Guide",
    link: "https://www.e4erelief.org/tipalti-international-grant-payment-guide",
  }
];

const PaymentOptionsPage: React.FC<PaymentOptionsPageProps> = ({ navigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
            <button onClick={() => navigate('support')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Support Center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              Payment Options
            </h1>
        </div>
        <p className="text-center text-white mb-12 max-w-2xl mx-auto">We partner with industry-leading payment providers to ensure your relief funds are delivered quickly and securely, wherever you are in the world.</p>
        
        <div className="mt-12 bg-[#004b8d] p-8 rounded-lg shadow-2xl border border-[#005ca0]/50 text-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4">
            US Applicants
          </h2>
          <p className="text-white mb-6 max-w-2xl mx-auto">
            For applicants within the United States, please review our payment guide to understand the available options and requirements for receiving your grant.
          </p>
          <a 
            href="https://www.e4erelief.org/rs-grant-payment-guide?hs_preview=tPjgviPn-128427360771"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-8 rounded-md transition-colors duration-200"
          >
            View US Payment Guide
          </a>
        </div>
        
        <div className="mt-12 bg-[#004b8d] p-8 rounded-lg shadow-2xl border border-[#005ca0]/50 text-left">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center">
            International Applicants
          </h2>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-2">International Grant Award Payment Support</h3>
          <p className="text-gray-300">
            Once a grant is awarded, there are a few important registration steps you must complete before financial assistance is received. To receive this financial assistance, you must successfully complete your account registration with our payment partners. 
            <a href="https://employeerelieffund.org/international-grant-distribution-checklist/" target="_blank" rel="noopener noreferrer" className="text-[#ff8400] hover:underline font-semibold"> Click here </a>
            to review the international grant award guide.
          </p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-4">Payment Partner Information:</h3>
          <div className="space-y-4">
            {internationalPartners.map(partner => (
              <a 
                key={partner.name}
                href={partner.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 bg-[#003a70]/50 p-4 rounded-lg hover:bg-[#005ca0]/50 transition-colors duration-200 border border-transparent hover:border-[#ff8400]/50"
              >
                <img src={partner.logo} alt={`${partner.name} logo`} className="h-8 w-auto flex-shrink-0" />
                <span className="text-white font-medium">{partner.description}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;