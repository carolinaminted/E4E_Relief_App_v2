import React, { useState } from 'react';

type Page = 'support';

interface FAQPageProps {
  navigate: (page: Page) => void;
}

const faqs = [
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
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 text-white bg-[#003a70]/30">
                    <div>{faq.answer}</div>
                </div>
            </div>
        </div>
    )
};

const FAQPage: React.FC<FAQPageProps> = ({ navigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
            <button onClick={() => navigate('support')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Support Center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              FAQ's
            </h1>
        </div>
        <div className="bg-[#004b8d]/80 rounded-lg shadow-2xl p-4 md:p-6 border border-[#005ca0]/50">
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

export default FAQPage;