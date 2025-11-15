import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, TokenUsageTableRow, TopSessionData, LastHourUsageDataPoint, TokenUsageFilters, TokenEvent, ModelPricing } from '../types';
import { tokenEventsRepo } from '../services/firestoreRepo';

import { TokenUsageFilterModal } from './TokenUsageFilters';
import { TopSessionChart, LastHourUsageChart, Last15MinutesUsageChart } from './TokenUsageCharts';
import TokenUsageTable from './TokenUsageTable';

interface TokenUsagePageProps {
  navigate: (page: 'fundPortal') => void;
  currentUser: UserProfile;
}

const MODEL_PRICING: ModelPricing = {
  'gemini-2.5-flash': { input: 0.00035, output: 0.00070 },
  'gemini-2.5-pro': { input: 0.0035, output: 0.0070 },
};

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CardLoader: React.FC = () => (
    <div className="absolute inset-0 bg-[#003a70]/90 rounded-lg flex flex-col items-center justify-center z-10">
        <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#ff8400] rounded-full animate-pulse" style={{ animationDelay: '-0.3s' }}></div>
            <div className="w-3 h-3 bg-[#ff8400] rounded-full animate-pulse" style={{ animationDelay: '-0.15s' }}></div>
            <div className="w-3 h-3 bg-[#ff8400] rounded-full animate-pulse"></div>
        </div>
        <p className="text-white text-sm mt-2">Loading Analytics...</p>
    </div>
);

const TokenUsagePage: React.FC<TokenUsagePageProps> = ({ navigate, currentUser }) => {
  const [isFetching, setIsFetching] = useState(true);
  const [allEvents, setAllEvents] = useState<TokenEvent[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filters, setFilters] = useState<TokenUsageFilters>({
    account: 'all',
    dateRange: { start: '', end: '' },
    feature: 'all',
    user: 'all',
    model: 'all',
    environment: 'all',
  });

  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem('tokenUsagePage_openSections');
    const defaults = { lastHour: true, last15: true, lifetime: true };
    try {
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
        console.error("Failed to parse open sections from localStorage", e);
        return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('tokenUsagePage_openSections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = (section: 'lastHour' | 'last15' | 'lifetime') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
        const events = await tokenEventsRepo.getEventsForFund({
          fundCode: currentUser.fundCode,
          filters,
          uid: currentUser.role === 'Admin' ? undefined : currentUser.uid,
        });
        setAllEvents(events);
    } catch (error) {
        console.error("Failed to fetch token analytics:", error);
        setAllEvents([]);
    } finally {
        setIsFetching(false);
    }
  }, [filters, currentUser.fundCode, currentUser.uid, currentUser.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterOptions = useMemo(() => {
      const eventsToFilter = allEvents;
      const features = [...new Set(eventsToFilter.map(e => e.feature))];
      const models = [...new Set(eventsToFilter.map(e => e.model))];
      const environments = [...new Set(eventsToFilter.map(e => e.environment))];
      const users = [...new Set(eventsToFilter.map(e => e.userId))];
      const accounts = [...new Set(eventsToFilter.map(e => e.account))];
      return { features, models, environments, users, accounts };
  }, [allEvents]);

  const tableData = useMemo((): TokenUsageTableRow[] => {
    const usageByFeatureInSession: { [key: string]: Omit<TokenUsageTableRow, 'user' | 'session' | 'feature'> } = {};

    for (const event of allEvents) {
        const key = `${event.userId}|${event.sessionId}|${event.feature}`;
        if (!usageByFeatureInSession[key]) {
            usageByFeatureInSession[key] = { input: 0, cached: 0, output: 0, total: 0, cost: 0 };
        }
        const pricing = MODEL_PRICING[event.model] || { input: 0, output: 0 };
        const eventCost = ((event.inputTokens / 1000) * pricing.input) + ((event.outputTokens / 1000) * pricing.output);

        usageByFeatureInSession[key].input += event.inputTokens;
        usageByFeatureInSession[key].cached += event.cachedInputTokens;
        usageByFeatureInSession[key].output += event.outputTokens;
        usageByFeatureInSession[key].total += event.inputTokens + event.cachedInputTokens + event.outputTokens;
        usageByFeatureInSession[key].cost += eventCost;
    }

    return Object.entries(usageByFeatureInSession).map(([key, data]) => {
        const [user, session, feature] = key.split('|');
        return { user, session, feature, ...data };
    });
  }, [allEvents]);

  const topSessionData = useMemo((): TopSessionData | null => {
    if (allEvents.length === 0) return null;
    const usageBySession: { [sessionId: string]: TopSessionData } = {};
    for (const event of allEvents) {
        if (!usageBySession[event.sessionId]) {
            usageBySession[event.sessionId] = { sessionId: event.sessionId, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0 };
        }
        usageBySession[event.sessionId].inputTokens += event.inputTokens;
        usageBySession[event.sessionId].cachedInputTokens += event.cachedInputTokens;
        usageBySession[event.sessionId].outputTokens += event.outputTokens;
        usageBySession[event.sessionId].totalTokens += event.inputTokens + event.cachedInputTokens + event.outputTokens;
    }
    const allSessions = Object.values(usageBySession);
    return allSessions.reduce((max, current) => current.totalTokens > max.totalTokens ? current : max, allSessions[0]);
  }, [allEvents]);

  const lastHourUsage = useMemo((): LastHourUsageDataPoint[] => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const relevantEvents = allEvents.filter(event => new Date(event.timestamp) >= oneHourAgo);
      const usageByMinute: Map<string, number> = new Map();

      for (const event of relevantEvents) {
          const eventDate = new Date(event.timestamp);
          eventDate.setSeconds(0, 0);
          const minuteKey = eventDate.toISOString();
          const totalTokens = event.inputTokens + event.cachedInputTokens + event.outputTokens;
          usageByMinute.set(minuteKey, (usageByMinute.get(minuteKey) || 0) + totalTokens);
      }
      
      const fullHourData: LastHourUsageDataPoint[] = [];
      for (let i = 0; i <= 60; i++) {
          const minuteTimestamp = new Date(oneHourAgo.getTime() + i * 60 * 1000);
          minuteTimestamp.setSeconds(0, 0);
          const minuteKey = minuteTimestamp.toISOString();
          fullHourData.push({ timestamp: minuteKey, totalTokens: usageByMinute.get(minuteKey) || 0 });
      }
      return fullHourData;
  }, [allEvents]);

  const last15MinutesUsage = useMemo((): LastHourUsageDataPoint[] => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const relevantEvents = allEvents.filter(event => new Date(event.timestamp) >= fifteenMinutesAgo);
      const usageByMinute: Map<string, number> = new Map();

      for (const event of relevantEvents) {
          const eventDate = new Date(event.timestamp);
          eventDate.setSeconds(0, 0);
          const minuteKey = eventDate.toISOString();
          const totalTokens = event.inputTokens + event.cachedInputTokens + event.outputTokens;
          usageByMinute.set(minuteKey, (usageByMinute.get(minuteKey) || 0) + totalTokens);
      }
      
      const full15MinutesData: LastHourUsageDataPoint[] = [];
      for (let i = 0; i <= 15; i++) {
          const minuteTimestamp = new Date(fifteenMinutesAgo.getTime() + i * 60 * 1000);
          minuteTimestamp.setSeconds(0, 0);
          const minuteKey = minuteTimestamp.toISOString();
          full15MinutesData.push({ timestamp: minuteKey, totalTokens: usageByMinute.get(minuteKey) || 0 });
      }
      return full15MinutesData;
  }, [allEvents]);

  const { totalCost, totalTokens } = useMemo(() => {
      return tableData.reduce((acc, row) => {
          acc.totalCost += row.cost;
          acc.totalTokens += row.total;
          return acc;
      }, { totalCost: 0, totalTokens: 0 });
  }, [tableData]);


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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full relative">
        <div className="relative flex justify-center items-center mb-8">
             <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
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
                    onClick={fetchData} 
                    className="bg-[#004b8d] hover:bg-[#005ca0] text-white font-semibold p-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center border border-[#005ca0] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh data"
                    disabled={isFetching}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isFetching ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Cost (USD)</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400] text-center">
                        {isFetching ? '$0.0000' : `$${totalCost.toFixed(4)}`}
                    </p>
                    {isFetching && <CardLoader />}
                </div>
                <div className="relative bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Tokens Used</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] text-center">
                        {isFetching ? '0' : totalTokens.toLocaleString()}
                    </p>
                    {isFetching && <CardLoader />}
                </div>
                 <div className="relative bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0] md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Highest-Token Session</h3>
                    <div className="pt-2">
                        {isFetching ? (
                            <div className="h-20" /> // Placeholder to prevent layout shift
                        ) : (
                            <TopSessionChart topSession={topSessionData} />
                        )}
                    </div>
                    {isFetching && <CardLoader />}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#003a70]/50 rounded-lg border border-[#005ca0]">
                    <button type="button" onClick={() => toggleSection('lastHour')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lastHour}>
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Session Tokens (Last Hour)</h3>
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
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Session Tokens (Last 15 Min)</h3>
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
                <button type="button" onClick={() => toggleSection('lifetime')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lifetime}>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Detailed Token Usage</h3>
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
