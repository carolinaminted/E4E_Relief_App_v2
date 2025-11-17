import React, { useState, useEffect, useCallback } from 'react';
import { usersRepo, applicationsRepo } from '../services/firestoreRepo';
import type { Application, UserProfile } from '../types';
import LoadingOverlay from './LoadingOverlay';

type Page = 'fundPortal';

interface LiveDashboardPageProps {
  navigate: (page: Page) => void;
  currentUser: UserProfile;
}

// --- Reusable UI Components ---

const MetricCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-[#003a70]/50 p-6 rounded-lg border border-[#005ca0] flex flex-col ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 text-center">{title}</h3>
      <div className="flex-grow flex items-center justify-center">
        {children}
      </div>
    </div>
);
  
const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-gray-400">No data available</p></div>;
    }
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;
  
    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 w-full">
        <div className="relative">
          <svg width="150" height="150" viewBox="0 0 120 120" className="transform -rotate-90">
            {data.map((item, index) => {
              if (item.value === 0) return null;
              const dashArray = (item.value / totalValue) * circumference;
              const rotation = (accumulatedAngle / totalValue) * 360;
              accumulatedAngle += item.value;
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${dashArray} ${circumference}`}
                  className="transition-all duration-500"
                  style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{totalValue.toLocaleString()}</span>
              <span className="text-xs text-gray-300">Total</span>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center">
              <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
              <span className="text-sm text-white">{item.label} ({item.value})</span>
            </div>
          ))}
        </div>
      </div>
    );
};

const HorizontalBarChartList: React.FC<{ data: { label: string; value: number }[]; colors: string[] }> = ({ data, colors }) => {
    const maxValue = Math.max(1, ...data.map(item => item.value));
    return (
      <div className="space-y-3 w-full">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3 w-full text-sm">
            <span className="text-gray-300 w-28 truncate text-right">{item.label}</span>
            <div className="flex-grow bg-[#004b8d] h-5 rounded-sm overflow-hidden">
              <div
                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: colors[index % colors.length] }}
                className="h-5 rounded-sm flex items-center justify-end pr-2 text-xs font-bold text-black transition-all duration-500"
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
};


interface LiveStats {
    totalAwarded: number;
    applicationStatusData: { label: string; value: number; color: string }[];
    userEngagementData: { label: string; value: number; color: string }[];
    topCountriesData: { label: string; value: number }[];
    topEventsData: { label: string; value: number }[];
    recentUsersData: { name: string; email: string; fund: string }[];
}


const LiveDashboardPage: React.FC<LiveDashboardPageProps> = ({ navigate, currentUser }) => {
    const [stats, setStats] = useState<LiveStats | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const chartColors = ['#ff8400', '#edda26', '#0091b3', '#94d600'];

    const fetchData = useCallback(async () => {
        setIsFetching(true);

        const emptyStats: LiveStats = {
            totalAwarded: 0,
            applicationStatusData: [],
            userEngagementData: [],
            topCountriesData: [],
            topEventsData: [],
            recentUsersData: []
        };

        try {
            const fundCode = currentUser.fundCode;
            if (!fundCode) {
                console.error("Admin user has no active fund code.");
                setStats(emptyStats);
                return;
            }
            const [users, applications] = await Promise.all([
                usersRepo.getForFund(fundCode),
                applicationsRepo.getForFund(fundCode),
            ]);

            // --- Process Data for Stats ---

            const totalUsers = users.length;

            const totalAwarded = applications
                .filter(app => app.status === 'Awarded')
                .reduce((sum, app) => sum + app.requestedAmount, 0);

            const statusCounts = applications.reduce((acc, app) => {
                const status = app.status === 'Submitted' ? 'In Review' : app.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const applicationStatusData = [
                { label: 'Awarded', value: statusCounts.Awarded || 0, color: chartColors[1] }, // yellow
                { label: 'Declined', value: statusCounts.Declined || 0, color: chartColors[2] }, // teal
                { label: 'In Review', value: statusCounts['In Review'] || 0, color: chartColors[0] },
            ];

            const appliedUserIds = new Set(applications.map(app => app.uid));
            const appliedUsersCount = appliedUserIds.size;
            const notEngagedCount = totalUsers - appliedUsersCount;

            const userEngagementData = [
                { label: 'Applied', value: appliedUsersCount, color: chartColors[0] }, // orange
                { label: 'Not Engaged', value: notEngagedCount > 0 ? notEngagedCount : 0, color: chartColors[3] }, // green
            ];

            const countryCounts = users.reduce((acc, user) => {
                const country = user.primaryAddress?.country || 'Unknown';
                acc[country] = (acc[country] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const topCountriesData = Object.entries(countryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([label, value]) => ({ label, value }));

            const eventCounts = applications.reduce((acc, app) => {
                const event = app.event === 'My disaster is not listed' ? (app.otherEvent || 'Other').trim() : app.event.trim();
                if(event) {
                    acc[event] = (acc[event] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const topEventsData = Object.entries(eventCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([label, value]) => ({ label, value }));

            const recentUsersData = users
                .sort((a, b) => (b.uid > a.uid ? 1 : -1)) // A simple sort to get "recent" users
                .slice(0, 5)
                .map(user => ({
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    fund: user.fundCode || 'N/A',
                }));

            setStats({
                totalAwarded,
                applicationStatusData,
                userEngagementData,
                topCountriesData,
                topEventsData,
                recentUsersData,
            });
            setLastRefresh(new Date());

        } catch (error) {
            console.error("Failed to fetch live dashboard data:", error);
            setStats(emptyStats);
        } finally {
            setIsFetching(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isFetching && !stats) {
        return <LoadingOverlay message="Fetching Live Data..." />;
    }

    if (!stats) {
        return (
             <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-center">
                 <p className="text-red-400">Could not load dashboard data.</p>
                 <button onClick={fetchData} className="mt-4 bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md">
                    Try Again
                 </button>
             </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="relative flex justify-center items-center mb-4">
                <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                </button>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Dashboard</h1>
            </div>
            
             <div className="flex flex-col items-center justify-center mb-8 gap-2">
                {lastRefresh && (
                    <p className="text-xs text-gray-400">
                        Last updated: {lastRefresh.toLocaleDateString()} at {lastRefresh.toLocaleTimeString()}
                    </p>
                )}
                <button 
                    onClick={fetchData} 
                    disabled={isFetching}
                    className="bg-[#004b8d] hover:bg-[#005ca0] text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 border border-[#005ca0] disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    {isFetching ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Grant Payments (USD)">
                    <div className="text-center">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">
                            ${stats.totalAwarded.toLocaleString()}
                        </p>
                    </div>
                </MetricCard>

                <MetricCard title="Applications by Decision">
                    <DonutChart data={stats.applicationStatusData} />
                </MetricCard>

                <MetricCard title="User Engagement">
                    <DonutChart data={stats.userEngagementData} />
                </MetricCard>

                <MetricCard title="Top 5 Countries by Users">
                    <HorizontalBarChartList data={stats.topCountriesData} colors={chartColors} />
                </MetricCard>

                <MetricCard title="Top 5 Apps by Event Type">
                    <HorizontalBarChartList data={stats.topEventsData} colors={chartColors} />
                </MetricCard>

                <MetricCard title="Recently Registered Users">
                    <div className="space-y-2 w-full">
                        {stats.recentUsersData.map((user, index) => (
                            <div key={index} className="grid grid-cols-10 gap-2 text-sm p-2 rounded hover:bg-[#004b8d]/50">
                                <span className="text-white truncate col-span-5">{user.name}</span>
                                <span className="text-gray-300 truncate col-span-5">{user.email}</span>
                            </div>
                        ))}
                    </div>
                </MetricCard>
            </div>
        </div>
    );
};

export default LiveDashboardPage;