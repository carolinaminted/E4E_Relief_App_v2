import React, { useState, useMemo, useRef, useEffect } from 'react';
import RequiredIndicator from './RequiredIndicator';

interface SearchableSelectorProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onUpdate: (value: string) => void;
  required?: boolean;
  variant?: 'boxed' | 'underline';
  error?: string;
}

const SearchableSelector: React.FC<SearchableSelectorProps> = ({ id, label, value, options, onUpdate, required, variant = 'boxed', error }) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, options]);

  const handleSelect = (option: string) => {
    setSearchTerm(option);
    onUpdate(option);
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // When clicking away, check if the current input is a valid option (case-insensitive).
        // If it is, ensure the parent state is updated with the correctly cased version.
        // If it's not, revert the input to the last valid value from the parent.
        const foundOption = options.find(option => option.toLowerCase() === searchTerm.toLowerCase());
        if (foundOption) {
            // A valid option was typed, possibly with different casing.
            if (foundOption !== value) {
                // Update parent with the correctly cased value from the options list.
                onUpdate(foundOption);
            }
            // Also, update the local search term to reflect the correct casing.
            setSearchTerm(foundOption);
        } else {
            // Revert to the last valid value from the parent if the typed text is not a match.
            setSearchTerm(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, searchTerm, value, options, onUpdate]);
  
  const baseInputClasses = "w-full text-white focus:outline-none focus:ring-0";
  const variantClasses = {
      boxed: `bg-[#005ca0] border rounded-md p-2 ${error ? 'border-red-500' : 'border-[#005ca0]'}`,
      underline: `bg-transparent border-0 border-b p-2 ${error ? 'border-red-500' : 'border-[#005ca0] focus:border-[#ff8400]'}`
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
        {label} <RequiredIndicator required={required} isMet={!!value} />
      </label>
      <input
        id={id}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        className={`${baseInputClasses} ${variantClasses[variant]}`}
        autoComplete="off"
        required={required}
      />
      {isOpen && (
        <ul className="absolute z-10 w-full bg-[#003a70] border border-[#005ca0] rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 text-white cursor-pointer hover:bg-[#005ca0]"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-400">No options found</li>
          )}
        </ul>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelector;