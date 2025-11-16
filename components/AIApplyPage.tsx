import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { MessageRole } from '../types';
import type { Fund } from '../data/fundData';
import type { ChatMessage, Application, UserProfile, Page, ApplicationFormData } from '../types';
import { createChatSession } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';
import { useTranslation, Trans } from 'react-i18next';
import Footer from './Footer';

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

const CircleIcon: React.FC = () => (
    <div className="w-5 h-5 border-2 border-gray-500 rounded-full"></div>
);

const AdditionalDetailsPreview: React.FC<{ profileData: Partial<UserProfile> | null | undefined }> = ({ profileData }) => {
    const { t } = useTranslation();
    
    const checklistItems = [
        { key: 'employmentStartDate', label: t('applyContactPage.employmentStartDate') },
        { key: 'eligibilityType', label: t('applyContactPage.eligibilityType') },
        { key: 'householdIncome', label: t('applyContactPage.householdIncome') },
        { key: 'householdSize', label: t('applyContactPage.householdSize') },
        { key: 'homeowner', label: t('applyContactPage.homeowner') },
        { key: 'preferredLanguage', label: t('applyContactPage.preferredLanguage') },
    ];

    const isComplete = (key: string) => {
        if (!profileData) return false;
        const value = profileData[key as keyof UserProfile];
        // Check for non-empty strings, non-empty numbers (0 is valid for income, but not size), and boolean-like strings
        return value !== undefined && value !== null && value !== '';
    };
    
    return (
        <div className="bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0] h-full flex flex-col p-4">
            <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-4 text-center">
                Additional Details Preview
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">As you answer the assistant, this list will update.</p>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
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

const AIApplyPage: React.FC<AIApplyPageProps> = ({ userProfile, applications, onChatbotAction, activeFund, navigate, applicationDraft }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);
  const initDoneForUser = useRef<string | null>(null);

  const sessionKey = userProfile ? `aiApplyChatHistory-${userProfile.uid}` : null;

  useEffect(() => {
    if (sessionKey && userProfile && initDoneForUser.current !== userProfile.uid) {
      try {
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          setMessages([{ role: MessageRole.MODEL, content: t('chatbotWidget.greeting') }]);
        }
      } catch (error) {
        console.error('Could not load chat history from session storage', error);
        setMessages([{ role: MessageRole.MODEL, content: t('chatbotWidget.greeting') }]);
      }
      initDoneForUser.current = userProfile.uid;
    }
  }, [sessionKey, t, userProfile]);

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
      chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed, 'aiApply');
      chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [applications, activeFund, userProfile, messages]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    const inputTokens = estimateTokens(userInput);

    if (!chatSessionRef.current && userProfile) {
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, messages.slice(-6), 'aiApply');
    }

    try {
      if (!chatSessionRef.current) {
        throw new Error("Chat session not initialized.");
      }
      const stream = await chatSessionRef.current.sendMessageStream({ message: userInput });
      
      let modelResponseText = '';
      let functionCalls: any[] = [];
      let modelResponseHasStarted = false;

      for await (const chunk of stream) {
        if (chunk.text) {
          modelResponseText += chunk.text;
          if (!modelResponseHasStarted) {
            setMessages(prev => [...prev, { role: MessageRole.MODEL, content: '' }]);
            modelResponseHasStarted = true;
          }
          setMessages(prev => {
            const newMessages = [...prev];
            if(newMessages.length > 0) {
               newMessages[newMessages.length - 1].content = modelResponseText;
            }
            return newMessages;
          });
        }
        
        if(chunk.functionCalls) {
            functionCalls.push(...chunk.functionCalls);
        }
      }

      if (functionCalls.length > 0) {
         if (!modelResponseHasStarted) {
            setMessages(prev => [...prev, { role: MessageRole.MODEL, content: '' }]);
          }

        const functionResponses = [];
        for(const call of functionCalls) {
            onChatbotAction(call.name, call.args);
            functionResponses.push({ 
                functionResponse: {
                    name: call.name, 
                    response: { result: 'ok' } 
                }
            });
        }

        const toolResponseStream = await chatSessionRef.current.sendMessageStream({ message: functionResponses });

        for await (const chunk of toolResponseStream) {
            if (chunk.text) {
                modelResponseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    if(newMessages.length > 0) {
                        newMessages[newMessages.length - 1].content = modelResponseText;
                    }
                    return newMessages;
                });
            }
        }
      }
      
      const outputTokens = estimateTokens(modelResponseText);
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
  }, [isLoading, applications, onChatbotAction, activeFund, userProfile, t, messages]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="relative flex justify-center items-center mb-4 md:mb-8">
            <button onClick={() => navigate('home')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label={t('aiApplyPage.backToHome')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                {t('aiApplyPage.title')}
            </h1>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
            {/* Main Chat Area */}
            <main className="w-full md:w-3/5 flex-1 flex flex-col bg-[#003a70]/50 rounded-lg shadow-2xl border border-[#005ca0]">
                <header className="p-4 border-b border-[#005ca0] flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        {t('chatbotWidget.title')}
                        </h2>
                        <p className="text-xs text-gray-400 italic mt-1">
                            <Trans
                            i18nKey="chatbotWidget.disclaimer"
                            components={{
                                1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />,
                                2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />,
                            }}
                            />
                        </p>
                    </div>
                </header>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatWindow messages={messages} isLoading={isLoading} />
                </div>
                <footer className="p-4 border-t border-[#005ca0] flex-shrink-0">
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </footer>
            </main>

            {/* Details Preview Panel */}
            <aside className="hidden md:flex md:w-2/5">
                <AdditionalDetailsPreview profileData={applicationDraft?.profileData} />
            </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AIApplyPage;
