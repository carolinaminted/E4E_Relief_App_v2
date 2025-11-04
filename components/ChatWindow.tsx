import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import ChatMessageBubble from './ChatMessageBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const LoadingIndicator: React.FC = () => (
    <div className="flex justify-start p-4">
        <div className="flex items-center space-x-2 bg-[#005ca0] text-white rounded-lg p-3 max-w-prose animate-pulse">
            <div className="w-2 h-2 bg-[#ff8400] rounded-full"></div>
            <div className="w-2 h-2 bg-[#ff8400] rounded-full animation-delay-200"></div>
            <div className="w-2 h-2 bg-[#ff8400] rounded-full animation-delay-400"></div>
        </div>
    </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <ChatMessageBubble key={index} message={msg} />
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && <LoadingIndicator />}
    </div>
  );
};

export default ChatWindow;