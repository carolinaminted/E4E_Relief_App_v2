import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
// FIX: Separated type and value imports for ChatMessage, MessageRole, and Application.
import { MessageRole } from '../types';
import type { Fund } from '../data/fundData';
import type { ChatMessage, Application } from '../types';
import { createChatSession } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';

interface ChatbotWidgetProps {
  applications: Application[];
  onChatbotAction: (functionName: string, args: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLElement>;
  activeFund: Fund | null;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ applications, onChatbotAction, isOpen, setIsOpen, scrollContainerRef, activeFund }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, content: "Hello! I'm the Relief Assistant. How can I help you today? Feel free to tell me about your situation." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);

  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // This ensures CSS transitions are only applied after the initial render, preventing a "flash" on load.
    setIsMounted(true);

    if (isOpen) {
        // FIX: Pass activeFund to createChatSession
        chatSessionRef.current = createChatSession(activeFund, applications);
        chatTokenSessionIdRef.current = `ai-chat-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [isOpen, applications, activeFund]);
  
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

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Scrolling down and we're not near the top of the page
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
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    const inputTokens = estimateTokens(userInput);

    if (!chatSessionRef.current) {
        // FIX: Pass activeFund to createChatSession
        chatSessionRef.current = createChatSession(activeFund, applications);
    }

    try {
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
            // FIX: Correct the structure of the function response object.
            functionResponses.push({ 
                functionResponse: {
                    name: call.name, 
                    response: { result: 'ok' } 
                }
            });
        }

        // FIX: A function response must be sent as a Part in the 'message' property of the request.
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
        content: "Sorry, I encountered an error. Please try again." 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, applications, onChatbotAction, activeFund]);

  const toggleChat = () => setIsOpen(!isOpen);
  
  return (
    <>
      <div 
        className={`fixed top-24 bottom-40 w-full max-w-sm max-h-[600px] bg-[#ff8400] rounded-lg shadow-2xl flex flex-col z-50 border border-[#c2410c] transition-all duration-300 ease-in-out left-1/2 -translate-x-1/2 md:top-auto md:bottom-24 md:h-[calc(100vh-8rem)] md:left-8 md:-translate-x-0 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
       <header className="bg-black/20 p-4 border-b border-black/30 shadow-lg rounded-t-lg flex-shrink-0">
        <div>
            <h1 className="text-lg font-bold text-white">
              Relief Assistant
            </h1>
            <p className="text-xs text-orange-200 italic mt-1">*AI Agent preview using generative responses</p>
        </div>
      </header>
       <main className="flex-1 overflow-hidden flex flex-col">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </main>
      <footer className="p-4 bg-black/20 border-t border-black/30 rounded-b-lg flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>

    <button
        onClick={toggleChat}
        className={`fixed bottom-20 left-4 md:bottom-8 md:left-8 bg-[#ff8400] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-[#e67700] transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#ff8400] focus:ring-opacity-50 z-50 ${isMounted ? 'transition-all duration-500 ease-in-out' : ''} ${isButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'}`}
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