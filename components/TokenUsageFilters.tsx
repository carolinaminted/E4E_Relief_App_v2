import React, { useState } from 'react';
import type { TokenUsageFilters as TokenUsageFiltersType } from '../types';

interface TokenUsageFiltersProps {
  filters: TokenUsageFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<TokenUsageFiltersType>>;
  filterOptions: {
    features: string[];
    models: string[];
    environments: string[];
    users: string[];
    accounts: string[];
  };
}

const FilterSelect: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }> = ({ label, value, onChange, options }) => (
    <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-[#004b8d] border border-[#005ca0] rounded-md p-2 text-white focus:ring-2 focus:ring-[#ff8400] focus:border-[#ff8400]">
            <option value="all">All</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const FilterDate: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, value, onChange }) => (
    <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
        <input type="date" value={value} onChange={onChange} className="w-full bg-[#004b8d] border border-[#005ca0] rounded-md p-2 text-white focus:ring-2 focus:ring-[#ff8400] focus:border-[#ff8400]" />
    </div>
);

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

// FIX: Changed to a named export to avoid ambiguity with the TokenUsageFilters type.
export const TokenUsageFilters: React.FC<TokenUsageFiltersProps> = ({ filters, setFilters, filterOptions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof TokenUsageFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: value },
    }));
  };

  return (
    <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
        <button type="button" onClick={() => setIsOpen(p => !p)} className="w-full flex justify-between items-center text-left p-4" aria-expanded={isOpen} aria-controls="filter-section">
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Filters</h3>
            <ChevronIcon isOpen={isOpen} />
        </button>
        <div id="filter-section" className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[#005ca0]/50' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="pt-4 flex flex-wrap gap-4 items-end">
                <FilterSelect label="Account" value={filters.account} onChange={(e) => handleFilterChange('account', e.target.value)} options={filterOptions.accounts} />
                <FilterDate label="Start Date" value={filters.dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} />
                <FilterDate label="End Date" value={filters.dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} />
                <FilterSelect label="Feature" value={filters.feature} onChange={(e) => handleFilterChange('feature', e.target.value)} options={filterOptions.features} />
                <FilterSelect label="User" value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} options={filterOptions.users} />
                <FilterSelect label="Model" value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)} options={filterOptions.models} />
                <FilterSelect label="Environment" value={filters.environment} onChange={(e) => handleFilterChange('environment', e.target.value)} options={filterOptions.environments} />
            </div>
      </div>
    </div>
  );
};

// Renamed props interface to avoid conflict in this file
interface TokenUsageFiltersProps {
  filters: TokenUsageFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<TokenUsageFiltersType>>;
  filterOptions: {
    features: string[];
    models: string[];
    environments: string[];
    users: string[];
    accounts: string[];
  };
}
