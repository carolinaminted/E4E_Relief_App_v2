import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
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


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
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
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        rows={1}
        disabled={isLoading}
        className="flex-1 bg-white text-black placeholder-gray-500 rounded-md focus:outline-none resize-none px-3 py-2"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold p-2 rounded-md transition-colors duration-200"
      >
        <SendIcon disabled={isLoading || !input.trim()} />
      </button>
    </div>
  );
};

export default ChatInput;