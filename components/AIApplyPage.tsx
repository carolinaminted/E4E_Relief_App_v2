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

export const AdditionalDetailsPreview: React.FC<{ userProfile: UserProfile | null, profileData: Partial<UserProfile> | null | undefined, baseChecklistItems: { key: string, label: string }[] }> = ({ userProfile, profileData, baseChecklistItems }) => {
    
    const checklistItems = baseChecklistItems;

    // This function checks if the item has been filled, either in the base profile OR during this session by the AI
    const isComplete = (key: string) => {
        // Check draft first, as it's the most up-to-date
        const draftValue = profileData?.[key as keyof UserProfile];
        if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
            return true;
        }

        // Then check base profile for pre-existing data
        const profileValue = userProfile?.[key as keyof UserProfile];
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
    };
    
    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] flex flex-col p-4 flex-1 min-h-0">
            <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center">
                Additional Details Preview
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">This list updates as you answer the assistant.</p>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {checklistItems.map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-2 bg-[#004b8d]/50 rounded-md">
                        <div className="flex-shrink-0 w-5 h-5">
                            {isComplete(item.key) ? <CheckmarkIcon /> : <CircleIcon />}
                        </div>
                        <span className={`text-sm ${isComplete(item.key) ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const EventDetailsPreview: React.FC<{ eventData: Partial<EventData> | null | undefined, eventChecklistItems: any[] }> = ({ eventData, eventChecklistItems }) => {
    const isComplete = (key: keyof EventData) => {
        if (!eventData) return false;
        const value = eventData[key];
        return value !== undefined && value !== null && value !== '';
    };

    const visibleItems = eventChecklistItems.filter(item => !item.condition || item.condition(eventData || {}));

    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] flex flex-col p-4 flex-1 min-h-0">
            <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center">
                Event Details Preview
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">This list updates as you answer the assistant.</p>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {visibleItems.map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-2 bg-[#004b8d]/50 rounded-md">
                        <div className="flex-shrink-0 w-5 h-5">
                            {isComplete(item.key as keyof EventData) ? <CheckmarkIcon /> : <CircleIcon />}
                        </div>
                        <span className={`text-sm ${isComplete(item.key as keyof EventData) ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompletionView: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] flex flex-col p-8 h-full justify-center items-center text-center">
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
      const historyToSeed = messages.length > 0 ? messages.slice(-6) : [];
      chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed, 'aiApply', applicationDraft);
      chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [applications, activeFund, userProfile, messages, applicationDraft]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    
    if (!chatSessionRef.current && userProfile) {
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, messages.slice(-6), 'aiApply', applicationDraft);
        if (!chatTokenSessionIdRef.current) {
            chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not initialized.");
      
      const inputTokens = estimateTokens(userInput);

      // Use non-streaming sendMessage to wait for the full response
      let response = await chatSessionRef.current.sendMessage({ message: userInput });

      let modelResponseText = response.text;
      const functionCalls = response.functionCalls;

      // If the model returns function calls, execute them and send back the results
      if (functionCalls && functionCalls.length > 0) {
          const functionResponses = functionCalls.map(call => {
              // This action updates the UI preview panes via state changes in the parent component
              onChatbotAction(call.name, call.args);
              return { functionResponse: { name: call.name, response: { result: 'ok' } } };
          });
          
          // Send the function responses back to the model and wait for its final text response
          response = await chatSessionRef.current.sendMessage({ message: functionResponses });
          modelResponseText = response.text;
      }

      // Only add the final model message to the chat history after all actions are complete
      if (modelResponseText) {
          setMessages(prev => [...prev, { role: MessageRole.MODEL, content: modelResponseText }]);
      }

      const outputTokens = estimateTokens(modelResponseText); // Estimate tokens from the final response
      if (chatTokenSessionIdRef.current) {
          logTokenEvent({
              feature: 'AI Assistant',
              model: 'gemini-2.5-flash',
              inputTokens,
              outputTokens,
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
  
  const isApplicationReadyForExpenses = useMemo(() => {
    if (!userProfile) return false;

    // 1. Check if all required profile fields are filled (in original profile or draft)
    const allProfileFieldsComplete = baseProfileChecklistItems.every(item => {
        const key = item.key as keyof UserProfile;
        const draftValue = applicationDraft?.profileData?.[key];
        if (draftValue !== undefined && draftValue !== null && draftValue !== '') return true;
        
        const profileValue = userProfile?.[key];
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
    });

    if (!allProfileFieldsComplete) return false;

    // 2. Check if all required and visible event fields are filled in the draft
    const eventData = applicationDraft?.eventData;
    if (!eventData) return false;

    const visibleEventItems = eventChecklistItems.filter(item => !item.condition || item.condition(eventData));

    const allEventFieldsComplete = visibleEventItems.every(item => {
        const key = item.key as keyof EventData;
        const value = eventData[key];

        if (key === 'powerLossDays' || key === 'evacuationNights') {
            return typeof value === 'number' && value > 0;
        }
        return value !== undefined && value !== null && value !== '';
    });
    
    return allEventFieldsComplete;
  }, [userProfile, applicationDraft, baseProfileChecklistItems, eventChecklistItems]);

  const handleNext = () => navigate('applyExpenses');

  return (
    <>
    <div className="absolute inset-0 top-20 bottom-16 md:relative md:top-auto md:bottom-auto flex flex-col">
        <div className="flex-1 flex flex-col p-4 md:p-8 md:pb-4 min-h-0">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                <header className="relative flex justify-center items-center mb-4 md:mb-8 flex-shrink-0">
                    <button onClick={() => navigate('home')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label={t('aiApplyPage.backToHome')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        {t('aiApplyPage.title')}
                    </h1>
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
                                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} showPreviewButton onPreviewClick={() => setIsPreviewModalOpen(true)} />
                                </footer>
                            </main>
                            <div className="flip-back w-full h-full">
                                <CompletionView onNext={handleNext} />
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
                        <aside className="w-2/5 flex flex-col gap-8">
                             {isApplicationReadyForExpenses ? (
                                <CompletionView onNext={handleNext} />
                            ) : (
                                <>
                                    <AdditionalDetailsPreview userProfile={userProfile} profileData={applicationDraft?.profileData} baseChecklistItems={baseProfileChecklistItems} />
                                    <EventDetailsPreview eventData={applicationDraft?.eventData} eventChecklistItems={eventChecklistItems} />
                                </>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-shrink-0 hidden md:block">
            <Footer />
        </div>
    </div>
    {isPreviewModalOpen && (
        <AIApplyPreviewModal
            onClose={() => setIsPreviewModalOpen(false)}
            userProfile={userProfile}
            applicationDraft={applicationDraft}
            baseChecklistItems={baseProfileChecklistItems}
            eventChecklistItems={eventChecklistItems}
        />
    )}
    </>
  );
};

export default AIApplyPage;