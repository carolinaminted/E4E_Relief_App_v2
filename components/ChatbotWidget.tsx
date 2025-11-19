import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
// FIX: Separated type and value imports for ChatMessage, MessageRole, and Application.
import { MessageRole } from '../types';
// FIX: Added missing import for Fund type.
import type { Fund } from '../data/fundData';
// FIX: Added UserProfile to type import
import type { ChatMessage, Application, UserProfile } from '../types';
import { createChatSession } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';
import { AI_GUARDRAILS } from '../config/aiGuardrails';
import { useTranslation } from 'react-i18next';

interface ChatbotWidgetProps {
  // FIX: Added missing userProfile prop.
  userProfile: UserProfile | null;
  applications: Application[];
  onChatbotAction: (functionName: string, args: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLElement>;
  // FIX: Added missing activeFund prop.
  activeFund: Fund | null;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ userProfile, applications, onChatbotAction, isOpen, setIsOpen, scrollContainerRef, activeFund }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, content: t('chatbotWidget.greeting') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);

  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const lastScrollY = useRef(0);
  const [sessionTurns, setSessionTurns] = useState(0);
  const hasSessionEnded = sessionTurns >= AI_GUARDRAILS.MAX_CHAT_TURNS_PER_SESSION;

  useEffect(() => {
    // This ensures CSS transitions are only applied after the initial render, preventing a "flash" on load.
    setIsMounted(true);

    if (isOpen && userProfile) {
        // FIX: Pass userProfile as the first argument to createChatSession.
        const historyToSeed = messages.length > 1 ? messages.slice(-6) : [];
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed);
        chatTokenSessionIdRef.current = `ai-chat-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [isOpen, applications, activeFund, userProfile, messages]);
  
  // Effect to handle scroll-based visibility for the chat button
  useEffect(() => {
    if (isOpen) {
      // If the chat window is open, the button must be visible to allow closing it.
      setIsButtonVisible(true);
      return;
    }

    const scrollableElement = scrollContainerRef.current;
    if (!scrollableElement) {
        return;
    }


    lastScrollY.current = scrollableElement.scrollTop;

    const handleScroll = () => {
      const currentScrollY = scrollableElement.scrollTop;
      
      // A small threshold to prevent flickering on minor scroll adjustments
      if (Math.abs(currentScrollY - lastScrollY.current) < 20) {
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsButtonVisible(false);
      } else {
        // Scrolling up
        setIsButtonVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, scrollContainerRef]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading || hasSessionEnded) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    
    if (!chatSessionRef.current && userProfile) {
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, messages.slice(-6));
        if (!chatTokenSessionIdRef.current) {
            chatTokenSessionIdRef.current = `ai-chat-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not initialized.");

      let totalInputTokens = estimateTokens(userInput);
      let totalOutputTokens = 0;

      // First API call
      let response = await chatSessionRef.current.sendMessage({ message: userInput });
      
      const functionCalls = response.functionCalls;

      // If the model returns function calls, execute them and send back the results.
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

      // Only add the final model message to the chat history after all actions are complete.
      if (modelResponseText) {
          setMessages(prev => [...prev, { role: MessageRole.MODEL, content: modelResponseText }]);
      }
      
      if (chatTokenSessionIdRef.current) {
          logTokenEvent({
              feature: 'AI Assistant',
              model: 'gemini-2.5-flash',
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              sessionId: chatTokenSessionIdRef.current,
          });
      }
      
      setSessionTurns(prev => prev + 1);

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
  }, [isLoading, applications, onChatbotAction, activeFund, userProfile, t, messages, hasSessionEnded]);

  const toggleChat = () => setIsOpen(!isOpen);
  
  return (
    <>
      <div 
        className={`fixed w-full max-w-sm h-[calc(100vh-8rem)] max-h-[600px] bg-[#004b8d] rounded-lg shadow-2xl flex flex-col z-50 border border-[#002a50] transition-all duration-300 ease-in-out left-1/2 -translate-x-1/2 md:left-8 md:-translate-x-0 bottom-[calc(10rem+env(safe-area-inset-bottom))] md:bottom-24 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
       <header className="bg-[#003a70]/70 p-4 border-b border-[#002a50] shadow-lg rounded-t-lg flex-shrink-0">
        <div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              {t('chatbotWidget.title')}
            </h1>
            <p className="text-xs text-gray-400 italic mt-1">*AI Agent preview using generative responses</p>
        </div>
      </header>
       <main className="flex-1 overflow-hidden flex flex-col">
        <ChatWindow messages={messages} isLoading={isLoading} />
        {hasSessionEnded && (
            <div className="p-2 bg-red-900/50 text-red-200 text-xs text-center">
                Session limit reached. Please refresh the page to start a new chat.
            </div>
        )}
      </main>
      <footer className="p-4 bg-[#003a70]/50 border-t border-[#002a50] rounded-b-lg flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={hasSessionEnded} />
      </footer>
    </div>

    <button
        onClick={toggleChat}
        className={`fixed left-8 bg-[#ff8400] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-[#e67700] transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#ff8400] focus:ring-opacity-50 z-50 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-8 ${isMounted ? 'transition-all duration-500 ease-in-out' : ''} ${isButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'}`}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;