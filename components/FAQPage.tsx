import React, { useState } from 'react';

type Page = 'support';

interface FAQPageProps {
  navigate: (page: Page) => void;
}

const faqs = [
  {
    question: "What is the maximum grant amount I can receive?",
    answer: "The maximum grant amount is $10,000 within any 12-month period, with a lifetime maximum of $50,000 per employee. All awards are subject to your remaining balance for each limit."
  },
  {
    question: "What types of events are covered?",
    answer: "We provide relief for qualified disasters such as floods, tornadoes, wildfires, and hurricanes that have occurred within the last 90 days. If your disaster is not listed, you can select 'My disaster is not listed' and provide specific details for review."
  },
  {
    question: "How quickly are applications processed?",
    answer: "Our automated system provides an instant decision upon submission for most applications that meet all the predefined criteria. If your application requires manual review (e.g., due to missing details for an evacuation), it may take a few additional business days."
  },
  {
    question: "Who is eligible to apply?",
    answer: "Full-time, part-time, and contract employees are eligible to apply, provided their employment started before the date of the disaster event. You must also have sufficient 12-month and lifetime grant balances remaining."
  },
  {
    question: "What if I was evacuated?",
    answer: "If you were evacuated from your primary residence, you must provide details such as the evacuation start date and the number of nights you were displaced to be considered for additional assistance related to temporary housing and other related expenses."
  },
  {
    question: "Do I need to repay the grant?",
    answer: "No, grants from E4E Relief are not loans and do not need to be repaid. They are intended to help you with immediate, essential needs following a qualified disaster."
  }
];

const FAQItem: React.FC<{ faq: { question: string, answer: string }, isOpen: boolean, onClick: () => void }> = ({ faq, isOpen, onClick }) => {
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
                    <p>{faq.answer}</p>
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