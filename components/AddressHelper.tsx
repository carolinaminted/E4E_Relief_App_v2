import React, { useState } from 'react';
import { parseAddressWithGemini } from '../services/geminiService';
import type { Address } from '../types';

interface AddressHelperProps {
  onAddressParsed: (parsedAddress: Partial<Address>) => void;
  variant?: 'boxed' | 'underline';
}

const AddressHelper: React.FC<AddressHelperProps> = ({ onAddressParsed, variant = 'boxed' }) => {
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address to parse.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const parsedAddress = await parseAddressWithGemini(addressInput);
      onAddressParsed(parsedAddress);
      setAddressInput(''); // Clear after successful parse
    } catch (e) {
      console.error("Failed to parse address:", e);
      setError('Could not parse the address. Please try again or fill fields manually.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const textareaClasses = {
    boxed: "w-full bg-[#005ca0] border border-[#005ca0] rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff8400] focus:border-[#ff8400]",
    underline: "w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#ff8400]"
  };

  return (
    <div className="bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0] mb-4">
      <p className="text-xs text-white mb-2">
        Type or paste a full address below and let our AI fill in the fields for you.
      </p>
      <div className="flex flex-col md:flex-row gap-2">
        <textarea
          id="address-helper-input"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA 94043"
          rows={2}
          className={textareaClasses[variant]}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={isLoading || !addressInput.trim()}
          className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-wait min-w-[80px] flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             "Submit"
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default AddressHelper;