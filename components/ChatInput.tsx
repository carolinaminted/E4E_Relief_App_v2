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
        className={`w-6 h-6 ${disabled ? 'text-gray-500' : 'text-white'}`}
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
    <div className="flex items-center space-x-2 bg-[#005ca0] rounded-lg p-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        rows={1}
        disabled={isLoading}
        className="flex-1 bg-transparent text-white placeholder-gray-300 focus:outline-none resize-none px-2 py-1"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="bg-[#ff8400] hover:bg-[#e67700] disabled:bg-[#898c8d] disabled:cursor-not-allowed text-white font-bold p-2 rounded-md transition-colors duration-200"
      >
        <SendIcon disabled={isLoading || !input.trim()} />
      </button>
    </div>
  );
};

export default ChatInput;