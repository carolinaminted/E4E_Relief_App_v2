import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';

type Page = 'support';

interface FAQPageProps {
  navigate: (page: Page) => void;
}

type FaqItem = {
    question: string;
    answer: string | string[];
};

const FAQItem: React.FC<{ faq: FaqItem, faqKey: string, isOpen: boolean, onClick: () => void }> = ({ faq, faqKey, isOpen, onClick }) => {
    
    const renderAnswer = () => {
        // Handle specific case with an embedded link using Trans component
        if (faqKey === 'donorFaqs.10') {
            return (
                <p>
                    <Trans i18nKey="faqPage.donorFaqs.10.answer">
                        For information about other ways to give, please contact E4E Relief Donor Services at 704-973-4564 or <a href="mailto:donorservices@e4erelief.org" className="text-[#ff8400] hover:underline">donorservices@e4erelief.org</a>.
                    </Trans>
                </p>
            );
        }

        if (Array.isArray(faq.answer)) {
            const content: React.ReactNode[] = [];
            let listItems: React.ReactNode[] = [];
            let inList = false;

            faq.answer.forEach((line, index) => {
                if (line.startsWith('#### ')) {
                    if (inList) {
                        content.push(<ul key={`ul-${index}`} className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
                        listItems = [];
                        inList = false;
                    }
                    content.push(<h4 key={`h4-${index}`} className="font-bold text-white mt-3 first:mt-0">{line.substring(5)}</h4>);
                } else if (line.startsWith('- ')) {
                    inList = true;
                    listItems.push(<li key={`li-${index}`}>{line.substring(2)}</li>);
                } else {
                    if (inList) {
                        content.push(<ul key={`ul-${index}`} className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
                        listItems = [];
                        inList = false;
                    }
                    content.push(<p key={`p-${index}`}>{line}</p>);
                }
            });

            if (inList) {
                content.push(<ul key="ul-last" className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
            }
            return <div className="space-y-3">{content}</div>;
        }

        return <p>{faq.answer}</p>;
    };

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
                    <div>{renderAnswer()}</div>
                </div>
            </div>
        </div>
    );
};

const FAQSection: React.FC<{ title: string; faqs: FaqItem[]; faqKeyPrefix: string; isOpen: boolean; onToggleSection: () => void }> = ({ title, faqs, faqKeyPrefix, isOpen, onToggleSection }) => {
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
                            faqKey={`${faqKeyPrefix}.${index}`}
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
    const { t } = useTranslation();
    const [openSection, setOpenSection] = useState<'applicant' | 'donor' | null>(() => {
        const saved = localStorage.getItem('faqPage_openSection');
        return saved ? JSON.parse(saved) : null;
    });

    const applicantFaqs = t('faqPage.applicantFaqs', { returnObjects: true }) as FaqItem[];
    const donorFaqs = t('faqPage.donorFaqs', { returnObjects: true }) as FaqItem[];

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
            <button onClick={() => navigate('support')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label={t('faqPage.backToSupport')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              {t('faqPage.title')}
            </h1>
        </div>
        
        <FAQSection
            title={t('faqPage.applicantTitle')}
            faqs={applicantFaqs}
            faqKeyPrefix="applicantFaqs"
            isOpen={openSection === 'applicant'}
            onToggleSection={() => handleToggleSection('applicant')}
        />
        
        <FAQSection
            title={t('faqPage.donorTitle')}
            faqs={donorFaqs}
            faqKeyPrefix="donorFaqs"
            isOpen={openSection === 'donor'}
            onToggleSection={() => handleToggleSection('donor')}
        />
      </div>
    </div>
  );
};

export default FAQPage;
