import React from 'react';

type Page = 'support';

interface PaymentOptionsPageProps {
  navigate: (page: Page) => void;
}

const paymentOptions = [
  {
    name: "Zelle",
    logo: "https://bronze-generous-halibut-259.mypinata.cloud/ipfs/bafkreigegnmtzs75tl276msqltkxfpsxnralxel37vqqui46xes6b2imei",
    description: "Quick and direct bank transfers for US-based recipients. A fast, safe and easy way to receive your grant directly in your U.S. bank account.",
    link: "https://www.zellepay.com/",
    cta: "Learn More about Zelle"
  },
  {
    name: "CAF America",
    logo: "https://bronze-generous-halibut-259.mypinata.cloud/ipfs/bafkreibkvdz3awat2ixtzfddb6yvqcljbni4oxuuifmw7nad6hgsvzlc7i",
    description: "Secure and compliant grant disbursement for international recipients, ensuring due diligence and adherence to all cross-border regulations.",
    link: "https://e4erelief.recipientselect.com",
    cta: "Visit Recipient Select"
  },
  {
    name: "Tipalti",
    logo: "https://bronze-generous-halibut-259.mypinata.cloud/ipfs/bafkreid4qymmxk4frxlehtn6rkygpiwtbesfzokvmzxind7ttuemog2cx4",
    description: "A comprehensive global payment automation platform that handles various payment methods, currencies, and regulatory requirements worldwide.",
    link: "https://tipalti.com/",
    cta: "Explore Tipalti"
  }
];

const PaymentOptionCard: React.FC<typeof paymentOptions[0]> = ({ name, logo, description, link, cta }) => (
    <div className="bg-[#004b8d] rounded-lg shadow-lg p-6 flex flex-col items-center text-center border border-[#005ca0]/50 transition-all duration-300 hover:border-[#ff8400]/50 hover:scale-105">
        <div className="h-20 flex items-center justify-center mb-4">
            <img src={logo} alt={`${name} logo`} className="max-h-16 max-w-[200px]" />
        </div>
        <p className="text-white flex-grow mb-6 text-sm">{description}</p>
        <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
        >
            {cta}
        </a>
    </div>
);


const PaymentOptionsPage: React.FC<PaymentOptionsPageProps> = ({ navigate }) => {
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paymentOptions.map(option => <PaymentOptionCard key={option.name} {...option} />)}
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;