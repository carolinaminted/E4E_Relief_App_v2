import React, { useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showPreviewButton?: boolean;
  onPreviewClick?: () => void;
}

const SendIcon: React.FC<{ disabled: boolean }> = ({ disabled }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-6 h-6 ${disabled ? 'text-gray-500' : 'text-[#003a70]'}`}
    >
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const PreviewIcon: React.FC<{ disabled: boolean }> = ({ disabled }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-6 h-6 ${disabled ? 'text-gray-500' : 'text-[#003a70]'}`}
    >
        <path fillRule="evenodd" d="M2.625 6.75a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0ZM3.375 6.75a7.5 7.5 0 007.5 7.5h.008a7.5 7.5 0 007.492-7.5 7.5 7.5 0 00-15-.008zM12 5.25a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
        <path d="M12.991 11.604a1.5 1.5 0 10-1.982 1.982 1.5 1.5 0 001.982-1.982zM15.75 7.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V8.25a.75.75 0 01.75-.75z" />
        <path fillRule="evenodd" d="M8.25 7.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V8.25a.75.75 0 01.75-.75zM9 15a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H9.75A.75.75 0 019 15z" clipRule="evenodd" />
    </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, showPreviewButton, onPreviewClick }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {showPreviewButton && (
        <button
            onClick={onPreviewClick}
            disabled={isLoading}
            className="md:hidden bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold rounded-md transition-colors duration-200 w-[50px] h-10 flex items-center justify-center flex-shrink-0"
            aria-label="Show application progress"
        >
            <PreviewIcon disabled={isLoading} />
        </button>
      )}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={t('chatbotWidget.placeholder')}
        rows={1}
        disabled={isLoading}
        className="flex-1 bg-white text-black text-base placeholder-gray-500 rounded-md focus:outline-none resize-none px-3 py-2"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold rounded-md transition-colors duration-200 w-[50px] h-10 flex items-center justify-center"
      >
        <SendIcon disabled={isLoading || !input.trim()} />
      </button>
    </div>
  );
};

export default ChatInput;