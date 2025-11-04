import React from 'react';
// FIX: Separated type and value imports for ChatMessage and MessageRole.
import { MessageRole } from '../types';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-[#ff8400] flex items-center justify-center font-bold text-white flex-shrink-0">
    U
  </div>
);

const ModelIcon: React.FC = () => (
  <img
    src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
    alt="Relief Assistant Logo"
    className="w-8 h-8 rounded-full flex-shrink-0"
  />
);

const ErrorIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    </div>
);


const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;
  const isError = message.role === MessageRole.ERROR;

  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser ? 'bg-[#ff8400]' : isError ? 'bg-red-500/20 text-red-300' : 'bg-[#005ca0]';
  const flexDirection = isUser ? 'flex-row-reverse' : 'flex-row';

  const Icon = isUser ? UserIcon : isError ? ErrorIcon : ModelIcon;

  return (
    <div className={`flex items-start gap-3 ${bubbleAlignment} ${flexDirection}`}>
      <Icon />
      <div className={`text-white rounded-lg p-3 max-w-xl md:max-w-2xl lg:max-w-3xl whitespace-pre-wrap break-words ${bubbleColor}`}>
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessageBubble;