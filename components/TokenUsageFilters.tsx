import React from 'react';
import { createPortal } from 'react-dom';
import type { TokenUsageFilters as TokenUsageFiltersType } from '../types';

interface TokenUsageFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const FilterDate: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, value, onChange }) => {
    const eventHandlers = {
        onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
            if (typeof e.target.showPicker === 'function') {
                try {
                    e.target.showPicker();
                } catch (error) {
                    console.error("Couldn't show date picker:", error);
                }
            }
        },
        onClick: (e: React.MouseEvent<HTMLInputElement>) => {
            if (typeof (e.target as HTMLInputElement).showPicker === 'function') {
                try {
                    (e.target as HTMLInputElement).showPicker();
                } catch (error) {
                    console.error("Couldn't show date picker:", error);
                }
            }
        }
    };
    
    return (
        <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
            <input 
                type="date" 
                value={value} 
                onChange={onChange} 
                {...eventHandlers}
                className="w-full bg-[#004b8d] border border-[#005ca0] rounded-md p-2 text-white focus:ring-2 focus:ring-[#ff8400] focus:border-[#ff8400]" 
            />
        </div>
    );
};

export const TokenUsageFilterModal: React.FC<TokenUsageFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters, 
  filterOptions 
}) => {
  if (!isOpen) return null;

  const handleFilterChange = (key: keyof TokenUsageFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: value },
    }));
  };
  
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[#004b8d] rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 relative border border-[#002a50]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-[#005ca0] pb-3 mb-4">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
            Filter Options
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
             <FilterSelect label="Account" value={filters.account} onChange={(e) => handleFilterChange('account', e.target.value)} options={filterOptions.accounts} />
             <FilterDate label="Start Date" value={filters.dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} />
             <FilterDate label="End Date" value={filters.dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} />
             <FilterSelect label="Feature" value={filters.feature} onChange={(e) => handleFilterChange('feature', e.target.value)} options={filterOptions.features} />
             <FilterSelect label="User" value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} options={filterOptions.users} />
             <FilterSelect label="Model" value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)} options={filterOptions.models} />
             <FilterSelect label="Environment" value={filters.environment} onChange={(e) => handleFilterChange('environment', e.target.value)} options={filterOptions.environments} />
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#005ca0] flex justify-end">
            <button 
                onClick={onClose}
                className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
            >
                Done
            </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};