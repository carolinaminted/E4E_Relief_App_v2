import React, { useState, useEffect } from 'react';

type Page = 'support';

interface FAQPageProps {
  navigate: (page: Page) => void;
}

const applicantFaqs = [
  {
    question: "How long will it take to process my application?",
    answer: "Once we have received all required supporting documentation a grant specialist will review your application and make a decision regarding your request within 3-5 business days. If approved, a grant distribution will be made based on your payment preference selected in your applicant profile."
  },
  {
    question: "How can I check on the status of my application?",
    answer: "You can easily check the status of your application on this portal. Once you've submitted an application, simply return to this portal, login, and check for a gray status bar at the top of your homepage. You can click the details link to get more information."
  },
  {
    question: "If my request is approved, how long should it take to receive my payment?",
    answer: (
      <>
        Grant award payment timing depends on selected payment type, geographical location, and banking information. Below are general timelines:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>U.S. applicants who select a digital payment method can expect to have funds deposited within 1-3 business days.</li>
          <li>U.S. applicants who select a mailed check typically receive funds within 7 business days. There is no tracking number and checks are mailed via USPS.</li>
          <li>International payment timing varies by country. Please reference your award letter when the grant is processed for additional details.</li>
        </ul>
      </>
    )
  },
    {
    question: "How much will I receive?",
    answer: "Grant awards are based on need and will vary according to the grant parameters for your company's relief program."
  },
  {
    question: "Do I have to repay the grant or pay taxes if I receive assistance?",
    answer: (
      <>
        Grants provided through the Relief Fund are not loans and do not have to be repaid.
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>For U.S. grant recipients, a grant generally will not result in taxable income (i.e., will not show up on your W2).</li>
          <li>For recipients outside the U.S., please check with your local tax advisor for more information.</li>
        </ul>
      </>
    )
  },
  {
    question: "If not selected for a grant, will I receive a notification with the reason why?",
    answer: "Yes, you will be informed via email that the program is unable to provide the assistance with details on why you may not have been selected for a grant."
  },
  {
    question: "Who reviews and makes the decision on the applications?",
    answer: "Your Relief Fund is administered by E4E Relief. E4E Relief is a third party that has been designated to manage the grant processing, decision-making, and administrative aspects of your Relief Program. This ensures confidentiality and impartial decision-making. They also have expertise on this subject matter to make sound decisions on qualifying events."
  },
  {
    question: "Who is E4E Relief?",
    answer: "E4E Relief is a 501(c)(3) public charity. E4E Relief's tax ID number is 87-3137387. With more than two decades of experience serving clients, E4E Relief is the nation's leading provider of employee disaster and hardship funds."
  }
];

const donorFaqs = [
  {
    question: "Who is E4E Relief?",
    answer: "E4E Relief is a 501(c)(3) public charity. E4E Relief's tax ID number is 87-3137387. With more than two decades of experience serving clients, E4E Relief is the nation's leading provider of employee disaster and hardship funds."
  },
  {
    question: "Can I designate my contribution to a specific individual?",
    answer: "While donations cannot be designated for a specific individual, country (location), or event, they do guarantee funds are available to provide assistance to individuals in need who meet the criteria of the program."
  },
  {
    question: "Are my donations to the fund tax-deductible? Will I get a statement at the end of the year?",
    answer: "A donation to your relief fund administered by E4E Relief may be tax-deductible, provided no goods or services were received in exchange for the donation. You will receive an emailed tax receipt for credit card and cryptocurrency donations. For any other gifts a gift acknowledgment will be provided for all those, $250 or more, made directly to the Fund via E4E Relief. Cash gifts, depending on the amount, may or may not require a receipt for tax purposes. Please check with your tax advisor for more information."
  },
  {
    question: "Do I need to donate to be eligible to apply for assistance from the Relief Fund?",
    answer: "Donations to the Relief Fund are voluntary and are not required to apply for assistance."
  },
  {
    question: "Does E4E Relief accept gifts from outside the U.S.?",
    answer: "Yes, our relief programs currently accept gifts from outside the U.S. However, we restrict sanctioned countries based on guidance from the Office of Foreign Assets Control (OFAC)."
  },
  {
    question: "When will I get a tax receipt for my donation of credit card, stock, crypto, or from my Donor Advised Fund?",
    answer: (
      <div className="space-y-3">
        <p>Upon completion of your donation, you will receive a tax receipt for any crypto or credit card donations made through the donation form. An acknowledgement receipt is provided for the pledge of stock and DAF donations.</p>
        <p>For stock donations, tax receipts for donors will be handled by our third-party partner - Renaissance Charitable Foundation (Ren).</p>
        <p>For DAF donations, tax receipts are provided by the nonprofit handling the gift transaction.</p>
      </div>
    )
  },
  {
    question: "How long does it take to process my donation?",
    answer: (
      <div className="space-y-3">
        <div>
          <h4 className="font-bold text-white">Credit Card</h4>
          <p>Credit Card donations take 3-5 business days to be received into the fund.</p>
        </div>
        <div>
          <h4 className="font-bold text-white">Crypto</h4>
          <p>Crypto donations take 2-5 business days for the transfer to be completed and received into the fund.</p>
        </div>
        <div>
          <h4 className="font-bold text-white">Stock</h4>
          <p>Timing to receive the funds on stock gifts will depend on how fast the donor's broker can process the transaction and move the shares, which can take up to 2-3 weeks for processing.</p>
        </div>
        <div>
          <h4 className="font-bold text-white">Donor Advised Funds (DAF)</h4>
          <p>Depending on the provider, we will receive the DAF donations anywhere between 1-3 weeks.</p>
        </div>
      </div>
    )
  },
  {
    question: "How do I see my historical donations?",
    answer: "You may review historical donations through your portal under 'My Donations' or by accessing The Giving Block donor dashboard. You will need to create an account using the same email address used when making the donation. This user ID and password IS NOT necessarily the same for your program portal, but a unique login with The Giving Block."
  },
  {
    question: "How do I request a replacement tax receipt?",
    answer: "Once you login to The Giving Block Donor Dashboard, you can access any receipts related to your previous donations."
  },
  {
    question: "What if I want to make recurring donations?",
    answer: "Once you login to The Giving Block Donor Dashboard, you can view your donation plans and update information related to your credit card and frequency of payments. You can also turn off any recurring donations here. Recurring donations cannot be made anonymously for regulatory reasons."
  },
  {
    question: "Who can I contact with additional questions?",
    answer: (
      <>
        For information about other ways to give, please contact E4E Relief Donor Services at 704-973-4564 or <a href="mailto:donorservices@e4erelief.org" className="text-[#ff8400] hover:underline">donorservices@e4erelief.org</a>.
      </>
    )
  }
];

const FAQItem: React.FC<{ faq: { question: string, answer: React.ReactNode }, isOpen: boolean, onClick: () => void }> = ({ faq, isOpen, onClick }) => {
    return (
        <div className="border-b border-[#005ca0]">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-4 px-2"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{faq.question}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 text-white bg-[#003a70]/30">
                    <div>{faq.answer}</div>
                </div>
            </div>
        </div>
    )
};

const FAQSection: React.FC<{ title: string, faqs: { question: string, answer: React.ReactNode }[], isOpen: boolean, onToggleSection: () => void }> = ({ title, faqs, isOpen, onToggleSection }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    
    useEffect(() => {
        if (!isOpen) {
            setOpenIndex(null);
        }
    }, [isOpen]);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-[#004b8d]/80 rounded-lg shadow-2xl border border-[#005ca0]/50 mb-6">
            <button
                onClick={onToggleSection}
                className="w-full flex justify-between items-center text-left p-4 md:p-6"
                aria-expanded={isOpen}
            >
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{title}</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 md:p-6 pt-0">
                    {faqs.map((faq, index) => (
                        <FAQItem 
                            key={index} 
                            faq={faq} 
                            isOpen={openIndex === index} 
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};


const FAQPage: React.FC<FAQPageProps> = ({ navigate }) => {
    const [openSection, setOpenSection] = useState<'applicant' | 'donor' | null>(() => {
        const saved = localStorage.getItem('faqPage_openSection');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem('faqPage_openSection', JSON.stringify(openSection));
    }, [openSection]);

    const handleToggleSection = (section: 'applicant' | 'donor') => {
        setOpenSection(openSection === section ? null : section);
    };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('support')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Support Center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              FAQ's
            </h1>
        </div>
        
        <FAQSection
            title="For Applicants"
            faqs={applicantFaqs}
            isOpen={openSection === 'applicant'}
            onToggleSection={() => handleToggleSection('applicant')}
        />
        
        <FAQSection
            title="For Donors"
            faqs={donorFaqs}
            isOpen={openSection === 'donor'}
            onToggleSection={() => handleToggleSection('donor')}
        />

      </div>
    </div>
  );
};

export default FAQPage;