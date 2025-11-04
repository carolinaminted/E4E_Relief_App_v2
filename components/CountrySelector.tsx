import React, { useState, useMemo, useRef, useEffect } from 'react';
import { countries } from '../data/countries';
import RequiredIndicator from './RequiredIndicator';

interface CountrySelectorProps {
  id: string;
  value: string;
  onUpdate: (value: string) => void;
  required?: boolean;
  variant?: 'boxed' | 'underline';
  error?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ id, value, onUpdate, required, variant = 'boxed', error }) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) {
      return countries;
    }
    return countries.filter(country =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelectCountry = (country: string) => {
    setSearchTerm(country);
    onUpdate(country);
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
        const foundCountry = countries.find(c => c.toLowerCase() === searchTerm.toLowerCase());
        if (foundCountry) {
            if (foundCountry !== value) {
                onUpdate(foundCountry);
            }
            // also update the local state to have the correct casing
            setSearchTerm(foundCountry);
        } else {
            setSearchTerm(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, searchTerm, value, onUpdate]);
  
  const baseInputClasses = "w-full text-white focus:outline-none focus:ring-0";
  const variantClasses = {
      boxed: `bg-[#005ca0] border rounded-md p-2 ${error ? 'border-red-500' : 'border-[#005ca0]'}`,
      underline: `bg-transparent border-0 border-b p-2 ${error ? 'border-red-500' : 'border-[#005ca0] focus:border-[#ff8400]'}`
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
        Location <RequiredIndicator required={required} isMet={!!value} />
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
          {filteredCountries.length > 0 ? (
            filteredCountries.map(country => (
              <li
                key={country}
                onClick={() => handleSelectCountry(country)}
                className="px-4 py-2 text-white cursor-pointer hover:bg-[#005ca0]"
              >
                {country}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-400">No countries found</li>
          )}
        </ul>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default CountrySelector;