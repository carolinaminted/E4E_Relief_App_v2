import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Chat } from '@google/genai';
import { MessageRole } from '../types';
import type { Fund } from '../data/fundData';
import type { ChatMessage, Application, UserProfile, Page, ApplicationFormData, EventData } from '../types';
import { createChatSession } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';
import { useTranslation, Trans } from 'react-i18next';
import Footer from './Footer';
import AIApplyPreviewModal from './AIApplyPreviewModal';
import EligibilityIndicator from './EligibilityIndicator';

interface AIApplyPageProps {
  userProfile: UserProfile | null;
  applications: Application[];
  onChatbotAction: (functionName: string, args: any) => void;
  activeFund: Fund | null;
  navigate: (page: Page) => void;
  applicationDraft: Partial<ApplicationFormData> | null;
}

const CheckmarkIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const CompletionCheckmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);


const CircleIcon: React.FC = () => (
    <div className="w-5 h-5 border-2 border-gray-500 rounded-full"></div>
);

const FirstTimeUserGuide: React.FC = () => (
    <div 
      className="absolute top-0 left-0 flex items-center justify-center h-full w-[50px] pointer-events-none"
      aria-hidden="true"
    >
      <div className="bg-[#ff8400] text-white p-2 rounded-lg shadow-lg text-xs whitespace-nowrap absolute -top-14 left-0 animate-bounce">
        Click to see questions
        <div className="absolute left-6 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#ff8400]"></div>
      </div>
    </div>
);


const SectionHeader: React.FC<{ title: string; isComplete: boolean; isOpen: boolean; onToggle: () => void }> = ({ title, isComplete, isOpen, onToggle }) => (
    <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left py-3 px-4 bg-[#004b8d]/50 rounded-t-md border-b border-[#005ca0]"
        aria-expanded={isOpen}
    >
        <div className="flex items-center gap-3">
            {isComplete && <CheckmarkIcon />}
            <h2 className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] ${isComplete ? 'opacity-60' : ''}`}>{title}</h2>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </button>
);

const AIApplyPreviewPane: React.FC<{
    userProfile: UserProfile | null;
    applicationDraft: Partial<ApplicationFormData> | null;
    baseChecklistItems: { key: string; label: string }[];
    eventChecklistItems: any[];
}> = ({ userProfile, applicationDraft, baseChecklistItems, eventChecklistItems }) => {
    const { t } = useTranslation();

    const isAdditionalDetailsComplete = useMemo(() => {
        if (!userProfile) return false;
        return baseChecklistItems.every(item => {
            const key = item.key as keyof UserProfile;
            const draftValue = applicationDraft?.profileData?.[key];
            if (draftValue !== undefined && draftValue !== null && draftValue !== '') return true;
            
            const profileValue = userProfile?.[key];
            return profileValue !== undefined && profileValue !== null && profileValue !== '';
        });
    }, [userProfile, applicationDraft, baseChecklistItems]);

    const isEventDetailsComplete = useMemo(() => {
        const eventData = applicationDraft?.eventData;
        if (!eventData) return false;

        const visibleEventItems = eventChecklistItems.filter(item => !item.condition || item.condition(eventData));
        if (visibleEventItems.length === 0 && !eventData.event) return false;

        return visibleEventItems.every(item => {
            const key = item.key as keyof EventData;
            const value = eventData[key];
            if (key === 'powerLossDays' || key === 'evacuationNights') {
                return typeof value === 'number' && value > 0;
            }
            return value !== undefined && value !== null && value !== '';
        });
    }, [applicationDraft, eventChecklistItems]);
    
    const [openSections, setOpenSections] = useState({
        additional: !isAdditionalDetailsComplete,
        event: !isEventDetailsComplete,
    });

    useEffect(() => {
        if (isAdditionalDetailsComplete && openSections.additional) {
            setOpenSections(prev => ({ ...prev, additional: false }));
        }
        if (isEventDetailsComplete && openSections.event) {
            setOpenSections(prev => ({ ...prev, event: false }));
        }
    }, [isAdditionalDetailsComplete, isEventDetailsComplete]);

    const toggleSection = (section: 'additional' | 'event') => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };
    
    const isProfileItemComplete = (key: string) => {
        const draftValue = applicationDraft?.profileData?.[key as keyof UserProfile];
        if (draftValue !== undefined && draftValue !== null && draftValue !== '') return true;
        const profileValue = userProfile?.[key as keyof UserProfile];
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
    };

    const isEventItemComplete = (key: keyof EventData) => {
        if (!applicationDraft?.eventData) return false;
        const value = applicationDraft.eventData[key];
        return value !== undefined && value !== null && value !== '';
    };

    const visibleEventItems = eventChecklistItems.filter(item => !item.condition || item.condition(applicationDraft?.eventData || {}));


    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] flex flex-col p-4 flex-1 min-h-0">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center flex-shrink-0">
                Application Progress
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4 flex-shrink-0">{t('aiApplyPage.previewSubtitle')}</p>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {/* Additional Details Section */}
                <div className="bg-[#004b8d]/30 rounded-md">
                    <SectionHeader title={t('aiApplyPage.additionalDetailsPreviewTitle')} isComplete={isAdditionalDetailsComplete} isOpen={openSections.additional} onToggle={() => toggleSection('additional')} />
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.additional ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-3 space-y-2">
                            {baseChecklistItems.map(item => (
                                <div key={item.key} className="flex items-center gap-3 p-2 bg-[#004b8d]/50 rounded-md">
                                    <div className="flex-shrink-0 w-5 h-5">
                                        {isProfileItemComplete(item.key) ? <CheckmarkIcon /> : <CircleIcon />}
                                    </div>
                                    <span className={`text-sm ${isProfileItemComplete(item.key) ? 'text-gray-400 line-through' : 'text-white'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Event Details Section */}
                <div className="bg-[#004b8d]/30 rounded-md">
                     <SectionHeader title={t('aiApplyPage.eventDetailsPreviewTitle')} isComplete={isEventDetailsComplete} isOpen={openSections.event} onToggle={() => toggleSection('event')} />
                     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.event ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-3 space-y-2">
                            {visibleEventItems.map(item => (
                                <div key={item.key} className="flex items-center gap-3 p-2 bg-[#004b8d]/50 rounded-md">
                                    <div className="flex-shrink-0 w-5 h-5">
                                        {isEventItemComplete(item.key as keyof EventData) ? <CheckmarkIcon /> : <CircleIcon />}
                                    </div>
                                    <span className={`text-sm ${isEventItemComplete(item.key as keyof EventData) ? 'text-gray-400 line-through' : 'text-white'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const CompletionView: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] flex flex-col p-8 flex-1 justify-center items-center text-center">
            <CompletionCheckmarkIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4">
                Application Almost Complete!
            </h2>
            <p className="text-gray-300 mb-6">
                You have answered all the initial questions. Please proceed to the next step to add your expenses.
            </p>
            <button
                onClick={onNext}
                className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
            >
                {t('common.next')}: Add Expenses
            </button>
        </div>
    );
};


const AIApplyPage: React.FC<AIApplyPageProps> = ({ userProfile, applications, onChatbotAction, activeFund, navigate, applicationDraft }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);
  const [hasInteractedWithPreview, setHasInteractedWithPreview] = useState(() => {
    // Check if we are in a browser environment
    if (typeof window === 'undefined') {
        return true; // Default to 'interacted' on server or non-browser envs
    }
    // On desktop, the preview pane is visible, so this feature is not needed.
    if (window.innerWidth >= 768) { // md breakpoint in tailwind
        return true;
    }
    // On mobile, check session storage
    return sessionStorage.getItem('ai-apply-preview-interacted') === 'true';
  });
  const initDoneForUser = useRef<string | null>(null);

  const sessionKey = userProfile ? `aiApplyChatHistory-${userProfile.uid}` : null;
  const greetingMessage = t('aiApplyPage.greeting');

  useEffect(() => {
    if (sessionKey && userProfile && initDoneForUser.current !== userProfile.uid) {
      try {
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
        }
      } catch (error) {
        console.error('Could not load chat history from session storage', error);
        setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
      }
      initDoneForUser.current = userProfile.uid;
    }
  }, [sessionKey, greetingMessage, userProfile]);

  useEffect(() => {
    if (sessionKey && messages.length > 0) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages));
      } catch (error) {
        console.error('Could not save chat history to session storage', error);
      }
    }
  }, [sessionKey, messages]);

  useEffect(() => {
    if (userProfile) {
      if (!chatTokenSessionIdRef.current) {
        chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
      }
      const historyToSeed = messages.length > 0 ? messages.slice(-6) : [];
      chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed, 'aiApply', applicationDraft);
    }
  }, [applications, activeFund, userProfile, messages, applicationDraft]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    
    if (!chatSessionRef.current && userProfile) {
        const historyToSeed = messages.slice(-6);
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed, 'aiApply', applicationDraft);
    }

    try {
        if (!chatSessionRef.current) throw new Error("Chat session not initialized.");
        
        let totalInputTokens = estimateTokens(userInput);
        let totalOutputTokens = 0;

        // First API call
        let response = await chatSessionRef.current.sendMessage({ message: userInput });
        
        const functionCalls = response.functionCalls;

        // If the model returns function calls, execute them and send back the results
        if (functionCalls && functionCalls.length > 0) {
            // "Output" of first call is the function call object
            totalOutputTokens += estimateTokens(JSON.stringify(functionCalls));

            const functionResponses = functionCalls.map(call => {
                onChatbotAction(call.name, call.args);
                return { functionResponse: { name: call.name, response: { result: 'ok' } } };
            });
            
            // "Input" for second call is the function response
            totalInputTokens += estimateTokens(JSON.stringify(functionResponses));
            
            // Second API call
            response = await chatSessionRef.current.sendMessage({ message: functionResponses });
        }
        
        // Final text response comes from either the first or second call
        const modelResponseText = response.text;
        totalOutputTokens += estimateTokens(modelResponseText);

        // Only add the final model message to the chat history after all actions are complete
        if (modelResponseText) {
            setMessages(prev => [...prev, { role: MessageRole.MODEL, content: modelResponseText }]);
        }

        // Log the aggregated event
        if (chatTokenSessionIdRef.current) {
            logTokenEvent({
                feature: 'AI Apply Chat',
                model: 'gemini-2.5-flash',
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                sessionId: chatTokenSessionIdRef.current,
            });
        }

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { 
        role: MessageRole.ERROR, 
        content: t('chatbotWidget.errorMessage') 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, applications, onChatbotAction, activeFund, userProfile, t, messages, applicationDraft]);

  const handlePreviewClick = useCallback(() => {
    if (!hasInteractedWithPreview) {
        setHasInteractedWithPreview(true);
        sessionStorage.setItem('ai-apply-preview-interacted', 'true');
    }
    setIsPreviewModalOpen(true);
  }, [hasInteractedWithPreview]);

  const baseProfileChecklistItems = useMemo(() => [
      { key: 'employmentStartDate', label: t('applyContactPage.employmentStartDate') },
      { key: 'eligibilityType', label: t('applyContactPage.eligibilityType') },
      { key: 'householdIncome', label: t('applyContactPage.householdIncome') },
      { key: 'householdSize', label: t('applyContactPage.householdSize') },
      { key: 'homeowner', label: t('applyContactPage.homeowner') },
      { key: 'preferredLanguage', label: t('applyContactPage.preferredLanguage') },
  ], [t]);

  const eventChecklistItems = useMemo(() => [
      { key: 'event', label: t('applyEventPage.disasterLabel') },
      { key: 'eventName', label: t('applyEventPage.errorEventName', 'What is the name of the event?'), condition: (data?: Partial<EventData>) => data?.event === 'Tropical Storm/Hurricane' },
      { key: 'eventDate', label: t('applyEventPage.eventDateLabel') },
      { key: 'powerLoss', label: t('applyEventPage.powerLossLabel') },
      { key: 'powerLossDays', label: t('applyEventPage.powerLossDaysLabel'), condition: (data?: Partial<EventData>) => data?.powerLoss === 'Yes' },
      { key: 'evacuated', label: t('applyEventPage.evacuatedLabel') },
      { key: 'evacuatingFromPrimary', label: t('applyEventPage.evacuatingFromPrimaryLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
      { key: 'evacuationReason', label: t('applyEventPage.evacuationReasonLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' && data?.evacuatingFromPrimary === 'No' },
      { key: 'stayedWithFamilyOrFriend', label: t('applyEventPage.stayedWithFamilyLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
      { key: 'evacuationStartDate', label: t('applyEventPage.evacuationStartDateLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
      { key: 'evacuationNights', label: t('applyEventPage.evacuationNightsLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
  ], [t]);
  
  const isAdditionalDetailsComplete = useMemo(() => {
    if (!userProfile) return false;
    return baseProfileChecklistItems.every(item => {
        const key = item.key as keyof UserProfile;
        const draftValue = applicationDraft?.profileData?.[key];
        if (draftValue !== undefined && draftValue !== null && draftValue !== '') return true;
        
        const profileValue = userProfile?.[key];
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
    });
  }, [userProfile, applicationDraft, baseProfileChecklistItems]);

  const isEventDetailsComplete = useMemo(() => {
    const eventData = applicationDraft?.eventData;
    if (!eventData) return false;

    const visibleEventItems = eventChecklistItems.filter(item => !item.condition || item.condition(eventData));
    if (visibleEventItems.length === 0 && !eventData.event) return false;

    return visibleEventItems.every(item => {
        const key = item.key as keyof EventData;
        const value = eventData[key];

        if (key === 'powerLossDays' || key === 'evacuationNights') {
            return typeof value === 'number' && value > 0;
        }
        return value !== undefined && value !== null && value !== '';
    });
  }, [applicationDraft, eventChecklistItems]);

  const isApplicationReadyForExpenses = isAdditionalDetailsComplete && isEventDetailsComplete;

  const handleNext = () => navigate('applyExpenses');

  return (
    <>
    <div className="absolute inset-0 top-20 bottom-16 md:relative md:top-auto md:bottom-auto flex flex-col md:flex-1">
        <div className="flex-1 flex flex-col p-4 md:p-8 md:pb-4 min-h-0">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                <header className="relative flex justify-center items-center mb-4 md:mb-8 flex-shrink-0">
                    <button onClick={() => navigate('home')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label={t('aiApplyPage.backToHome')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                            {t('aiApplyPage.title')}
                        </h1>
                        {userProfile ? (
                            <div className="mt-2 flex flex-col items-center gap-2">
                                {userProfile.fundName && userProfile.fundCode ? (
                                    <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                                ) : null}
                                <EligibilityIndicator 
                                    cvStatus={userProfile.classVerificationStatus} 
                                />
                            </div>
                        ) : (
                            <p className="text-lg text-gray-400 mt-2 italic">{t('applyPage.noActiveFund')}</p>
                        )}
                    </div>
                </header>

                <div className="flex-1 flex flex-col min-h-0">
                
                    {/* --- MOBILE VIEW --- */}
                    <div className="md:hidden flex-1 flex flex-col min-h-0 flip-container">
                        <div className={`flipper w-full h-full ${isApplicationReadyForExpenses ? 'is-flipped' : ''}`}>
                            <main className="flip-front w-full h-full flex flex-col bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0]">
                                <header className="p-4 border-b border-[#005ca0] flex-shrink-0">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('chatbotWidget.title')}</h2>
                                        <p className="text-xs text-gray-400 italic mt-1"><Trans i18nKey="chatbotWidget.disclaimer" components={{ 1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />, 2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" /> }} /></p>
                                    </div>
                                </header>
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <ChatWindow messages={messages} isLoading={isLoading} />
                                </div>
                                <footer className="p-4 border-t border-[#005ca0] flex-shrink-0">
                                    <div className="relative">
                                        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} showPreviewButton onPreviewClick={handlePreviewClick} disabled={!hasInteractedWithPreview} />
                                        {!hasInteractedWithPreview && <FirstTimeUserGuide />}
                                    </div>
                                </footer>
                            </main>
                            <div className="flip-back w-full h-full">
                                <div className="p-4 h-full">
                                    <CompletionView onNext={handleNext} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- DESKTOP VIEW --- */}
                    <div className="hidden md:flex flex-1 flex-row gap-8 min-h-0">
                        <main className="w-3/5 flex flex-col bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] min-h-0">
                            <header className="p-4 border-b border-[#005ca0] flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('chatbotWidget.title')}</h2>
                                    <p className="text-xs text-gray-400 italic mt-1"><Trans i18nKey="chatbotWidget.disclaimer" components={{1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />, 2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />}} /></p>
                                </div>
                            </header>
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ChatWindow messages={messages} isLoading={isLoading} />
                            </div>
                            <footer className="p-4 border-t border-[#005ca0] flex-shrink-0">
                                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                            </footer>
                        </main>
                        <aside className="w-2/5 flex flex-col min-h-0">
                             {isApplicationReadyForExpenses ? (
                                <CompletionView onNext={handleNext} />
                            ) : (
                                <AIApplyPreviewPane
                                    userProfile={userProfile}
                                    applicationDraft={applicationDraft}
                                    baseChecklistItems={baseProfileChecklistItems}
                                    eventChecklistItems={eventChecklistItems}
                                />
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-shrink-0">
            <Footer />
        </div>
    </div>
    {isPreviewModalOpen && (
        <AIApplyPreviewModal onClose={() => setIsPreviewModalOpen(false)}>
            <AIApplyPreviewPane
                userProfile={userProfile}
                applicationDraft={applicationDraft}
                baseChecklistItems={baseProfileChecklistItems}
                eventChecklistItems={eventChecklistItems}
            />
        </AIApplyPreviewModal>
    )}
    </>
  );
};

export default AIApplyPage;
