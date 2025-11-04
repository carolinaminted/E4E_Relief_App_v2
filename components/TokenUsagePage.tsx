import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, TokenUsageTableRow, TopSessionData, LastHourUsageDataPoint, TokenUsageFilters } from '../types';
import { getTokenUsageTableData, getTopSessionData, getUsageLastHour, getUsageLast15Minutes, getFilterOptions } from '../services/tokenTracker';

import { TokenUsageFilterModal } from './TokenUsageFilters';
import { TopSessionChart, LastHourUsageChart, Last15MinutesUsageChart } from './TokenUsageCharts';
import TokenUsageTable from './TokenUsageTable';
import LoadingOverlay from './LoadingOverlay';

interface TokenUsagePageProps {
  navigate: (page: 'home') => void;
  currentUser: UserProfile;
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const TokenUsagePage: React.FC<TokenUsagePageProps> = ({ navigate, currentUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableData, setTableData] = useState<TokenUsageTableRow[]>([]);
  const [topSessionData, setTopSessionData] = useState<TopSessionData | null>(null);
  const [lastHourUsage, setLastHourUsage] = useState<LastHourUsageDataPoint[]>([]);
  const [last15MinutesUsage, setLast15MinutesUsage] = useState<LastHourUsageDataPoint[]>([]);
  
  const [filterOptions, setFilterOptions] = useState(getFilterOptions());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filters, setFilters] = useState<TokenUsageFilters>({
    account: 'all',
    dateRange: { start: '', end: '' },
    feature: 'all',
    user: 'all',
    model: 'all',
    environment: 'all',
  });

  const [openSections, setOpenSections] = useState({
    topSession: true,
    lastHour: true,
    last15: true,
    lifetime: true,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { totalCost, totalTokens } = useMemo(() => {
    if (!tableData || tableData.length === 0) {
        return { totalCost: 0, totalTokens: 0 };
    }
    const cost = tableData.reduce((sum, row) => sum + row.cost, 0);
    const tokens = tableData.reduce((sum, row) => sum + row.total, 0);
    return { totalCost: cost, totalTokens: tokens };
  }, [tableData]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const fetchData = useCallback(() => {
    setTableData(getTokenUsageTableData(filters));
    setTopSessionData(getTopSessionData(filters));
    setLastHourUsage(getUsageLastHour(filters));
    setLast15MinutesUsage(getUsageLast15Minutes(filters));
    setFilterOptions(getFilterOptions());
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      fetchData();
      setIsRefreshing(false);
    }, 500);
  }, [fetchData]);

  const handleExportCSV = () => {
    if (tableData.length === 0) return;
    const headers = ['User', 'Session ID', 'Feature', 'Input Tokens', 'Cached Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)'];
    const rows = tableData.map(row => 
      [
        row.user,
        row.session,
        row.feature,
        row.input,
        row.cached,
        row.output,
        row.total,
        row.cost.toFixed(6)
      ].join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'token-usage.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full relative min-h-[calc(100vh-100px)]">
        {isLoading && <LoadingOverlay message="Loading Analytics..." />}
        
        <div className="relative flex justify-center items-center mb-2 py-1">
             <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Token Usage</h1>
        </div>

        <div className="flex justify-between items-center mb-4 py-2 border-y border-[#005ca0]">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsFilterModalOpen(true)} 
                    className="bg-[#004b8d] hover:bg-[#005ca0] text-white font-semibold p-2 rounded-md text-sm transition-colors duration-200 border border-[#005ca0]"
                    aria-label="Open filters"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
                <button 
                    onClick={handleRefresh} 
                    className="bg-[#004b8d] hover:bg-[#005ca0] text-white font-semibold p-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center border border-[#005ca0] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh data"
                    disabled={isRefreshing}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            
            <div>
                <button 
                    onClick={handleExportCSV}
                    disabled={tableData.length === 0}
                    className="bg-[#004b8d] hover:bg-[#005ca0] text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-[#005ca0]"
                    aria-label="Export Lifetime Token Usage to CSV"
                >
                    Export CSV
                </button>
            </div>
        </div>
        
        <div className="space-y-4">
            <TokenUsageFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} setFilters={setFilters} filterOptions={filterOptions} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Total Cost (USD)</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400] text-center">
                        ${totalCost.toFixed(4)}
                    </p>
                </div>
                <div className="bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Total Tokens Used</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] text-center">
                        {totalTokens.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
                    <button type="button" onClick={() => toggleSection('lastHour')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lastHour}>
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Token Usage (Last Hour)</h3>
                        <ChevronIcon isOpen={openSections.lastHour} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.lastHour ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[#005ca0]/50' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-4">
                            <LastHourUsageChart usage={lastHourUsage} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
                    <button type="button" onClick={() => toggleSection('last15')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.last15}>
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Token Usage (Last 15 Minutes)</h3>
                        <ChevronIcon isOpen={openSections.last15} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.last15 ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[#005ca0]/50' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-4">
                            <Last15MinutesUsageChart usage={last15MinutesUsage} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
                <button type="button" onClick={() => toggleSection('topSession')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.topSession}>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Highest-Token Session</h3>
                    <ChevronIcon isOpen={openSections.topSession} />
                </button>
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.topSession ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[#005ca0]/50' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-4">
                        <TopSessionChart topSession={topSessionData} />
                    </div>
                </div>
            </div>

            <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
                <button type="button" onClick={() => toggleSection('lifetime')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lifetime}>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Lifetime Token Usage</h3>
                    <ChevronIcon isOpen={openSections.lifetime} />
                </button>
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.lifetime ? 'max-h-[3000px] opacity-100 p-4 pt-0 border-t border-[#005ca0]/50' : 'max-h-0 opacity-0'}`}>
                     <div className="pt-4">
                        <TokenUsageTable data={tableData} />
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TokenUsagePage;