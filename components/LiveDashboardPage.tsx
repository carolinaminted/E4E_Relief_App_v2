import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// --- New Components for Payments Tab ---
const PaymentTrendChart: React.FC<{ data: { date: string, amount: number }[] }> = ({ data }) => {
    const width = 500;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };

    const maxAmount = Math.max(...data.map(d => d.amount), 0);
    const yMax = Math.ceil((maxAmount || 1) / 1000) * 1000;

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const getY = (amount: number) => height - padding.bottom - (amount / yMax) * (height - padding.top - padding.bottom);

    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.amount)}`).join(' ');
    const areaPath = `${linePath} L ${getX(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    const yAxisLabels = [0, yMax / 2, yMax].map(val => ({
        value: val,
        y: getY(val)
    }));

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff8400" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#ff8400" stopOpacity="0"/>
                </linearGradient>
            </defs>
            {yAxisLabels.map(label => (
                <g key={label.value}>
                    <text x={padding.left - 8} y={label.y + 4} textAnchor="end" fill="#9ca3af" fontSize="10">${label.value / 1000}k</text>
                    <line x1={padding.left} y1={label.y} x2={width - padding.right} y2={label.y} stroke="#005ca0" strokeWidth="0.5" strokeDasharray="2" />
                </g>
            ))}
            <text x={padding.left} y={height - 5} fill="#9ca3af" fontSize="10">30 days ago</text>
            <text x={width - padding.right} y={height - 5} textAnchor="end" fill="#9ca3af" fontSize="10">Today</text>

            <path d={areaPath} fill="url(#areaGradient)" />
            <path d={linePath} fill="none" stroke="#ff8400" strokeWidth="2" />
        </svg>
    );
};

const Treemap: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const colors = ['#ff8400', '#edda26', '#0091b3', '#94d600', '#005ca0'];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return <p className="text-gray-400">No payment data by country.</p>;
    
    // Simple algorithm to create a treemap layout
    const layout = (items: typeof data, width: number, height: number) => {
        let nodes = items.map(item => ({ ...item, area: (item.value / total) * width * height }));
        nodes.sort((a, b) => b.area - a.area);
        
        // This is a simplified squarify algorithm
        // In a real scenario, a more robust library would be used
        let rects = [];
        let row = [];
        let rowWidth = width;
        let x = 0, y = 0;

        for(const node of nodes) {
            row.push(node);
            let rowArea = row.reduce((sum, r) => sum + r.area, 0);
            let rowHeight = rowArea / rowWidth;

            if(rowWidth > rowHeight) { // Horizontal row
                let currentX = x;
                for(const r of row) {
                    let rWidth = r.area / rowHeight;
                    rects.push({ ...r, x: currentX, y, width: rWidth, height: rowHeight });
                    currentX += rWidth;
                }
            } else { // Vertical row
                // In this simplified version, we'll stick to horizontal for clarity
                // A full implementation is complex.
                 let currentX = x;
                for(const r of row) {
                    let rWidth = r.area / rowHeight;
                    rects.push({ ...r, x: currentX, y, width: rWidth, height: rowHeight });
                    currentX += rWidth;
                }
            }
        }
        return rects;
    };
    
    // For this demo, we use a simpler flexbox approach which is visually similar
    return (
        <div className="w-full h-48 flex flex-wrap gap-1">
            {data.map((item, index) => (
                <div 
                    key={item.label}
                    style={{ 
                        flexGrow: item.value, 
                        flexBasis: '100px', 
                        backgroundColor: colors[index % colors.length]
                    }}
                    className="flex items-center justify-center p-1 rounded transition-all duration-300 hover:scale-105 hover:z-10"
                    title={`${item.label}: $${item.value.toLocaleString()}`}
                >
                    <div className="text-center text-black font-bold text-xs overflow-hidden">
                        <p className="truncate">{item.label}</p>
                        <p>${(item.value / 1000).toFixed(1)}k</p>
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
    // New stats for Payments tab
    avgPayment: number;
    paymentsLast30Days: number;
    paymentsOverTime: { date: string; amount: number }[];
    recentPayments: Application[];
    // FIX: Added a separate property for payment data by country to resolve duplicate key issue.
    topCountriesByPayment: { label: string; value: number }[];
}


const LiveDashboardPage: React.FC<LiveDashboardPageProps> = ({ navigate, currentUser }) => {
    const [stats, setStats] = useState<LiveStats | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'payments'>('home');

    const chartColors = ['#ff8400', '#edda26', '#0091b3', '#94d600'];

    const fetchData = useCallback(async () => {
        setIsFetching(true);

        try {
            const fundCode = currentUser.fundCode;
            if (!fundCode) throw new Error("Admin user has no active fund code.");

            const [users, applications] = await Promise.all([
                usersRepo.getForFund(fundCode),
                applicationsRepo.getForFund(fundCode),
            ]);

            const awardedApps = applications.filter(app => app.status === 'Awarded');
            const totalAwarded = awardedApps.reduce((sum, app) => sum + app.requestedAmount, 0);

            // --- Home Tab Stats ---
            const statusCounts = applications.reduce((acc, app) => {
                const status = app.status === 'Submitted' ? 'In Review' : app.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const applicationStatusData = [
                { label: 'Awarded', value: statusCounts.Awarded || 0, color: chartColors[1] },
                { label: 'Declined', value: statusCounts.Declined || 0, color: chartColors[2] },
                { label: 'In Review', value: statusCounts['In Review'] || 0, color: chartColors[0] },
            ];

            const appliedUserIds = new Set(applications.map(app => app.uid));
            const userEngagementData = [
                { label: 'Applied', value: appliedUserIds.size, color: chartColors[0] },
                { label: 'Not Engaged', value: Math.max(0, users.length - appliedUserIds.size), color: chartColors[3] },
            ];
            
            const countryCounts = users.reduce((acc, user) => {
                const country = user.primaryAddress?.country || 'Unknown';
                acc[country] = (acc[country] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topCountriesData = Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([l, v]) => ({ label: l, value: v }));
            
            const eventCounts = applications.reduce((acc, app) => {
                const event = app.event === 'My disaster is not listed' ? (app.otherEvent || 'Other').trim() : app.event.trim();
                if(event) acc[event] = (acc[event] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topEventsData = Object.entries(eventCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([l, v]) => ({ label: l, value: v }));

            const recentUsersData = users.sort((a, b) => (b.uid > a.uid ? 1 : -1)).slice(0, 5).map(u => ({ name: `${u.firstName} ${u.lastName}`, email: u.email, fund: u.fundCode || 'N/A' }));

            // --- Payments Tab Stats ---
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const paymentsLast30Days = awardedApps.filter(app => new Date(app.decisionedDate) >= thirtyDaysAgo).length;
            
            const paymentsByDay: Record<string, number> = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                paymentsByDay[d.toISOString().split('T')[0]] = 0;
            }
            awardedApps.forEach(app => {
                const date = new Date(app.decisionedDate).toISOString().split('T')[0];
                if (paymentsByDay[date] !== undefined) {
                    paymentsByDay[date] += app.requestedAmount;
                }
            });
            const paymentsOverTime = Object.entries(paymentsByDay).map(([date, amount]) => ({ date, amount }));

            const paymentsByCountry = awardedApps.reduce((acc, app) => {
                const country = app.profileSnapshot.primaryAddress.country || 'Unknown';
                acc[country] = (acc[country] || 0) + app.requestedAmount;
                return acc;
            }, {} as Record<string, number>);
            const topCountriesByPayment = Object.entries(paymentsByCountry).sort(([,a],[,b]) => b-a).slice(0,5).map(([l,v]) => ({label: l, value: v}));


            setStats({
                totalAwarded, applicationStatusData, userEngagementData, topCountriesData, topEventsData, recentUsersData,
                avgPayment: awardedApps.length > 0 ? totalAwarded / awardedApps.length : 0,
                paymentsLast30Days,
                paymentsOverTime,
                // FIX: Correctly assign payment data to its own property instead of overwriting user country data.
                topCountriesByPayment: topCountriesByPayment,
                recentPayments: awardedApps.sort((a, b) => new Date(b.decisionedDate).getTime() - new Date(a.decisionedDate).getTime()).slice(0, 10),
            });
            setLastRefresh(new Date());

        } catch (error) {
            console.error("Failed to fetch live dashboard data:", error);
            setStats(null);
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
    
    const TabButton: React.FC<{ tabName: 'home' | 'payments'; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors duration-200 border-b-2 ${
                activeTab === tabName
                    ? 'text-white border-[#ff8400] bg-[#004b8d]/50'
                    : 'text-gray-400 border-transparent hover:text-white'
            }`}
        >
            {label}
        </button>
    );

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
            
             <div className="flex flex-col items-center justify-center mb-6 gap-2">
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

            <div className="border-b border-[#005ca0] mb-6">
                <TabButton tabName="home" label="Home" />
                <TabButton tabName="payments" label="Payments" />
            </div>
            
            {activeTab === 'home' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out]">
                    <MetricCard title="Total Grant Payments (USD)">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">${stats.totalAwarded.toLocaleString()}</p>
                    </MetricCard>
                    <MetricCard title="Applications by Decision"><DonutChart data={stats.applicationStatusData} /></MetricCard>
                    <MetricCard title="User Engagement"><DonutChart data={stats.userEngagementData} /></MetricCard>
                    <MetricCard title="Top 5 Countries by Users"><HorizontalBarChartList data={stats.topCountriesData} colors={chartColors} /></MetricCard>
                    <MetricCard title="Top 5 Apps by Event Type"><HorizontalBarChartList data={stats.topEventsData} colors={chartColors} /></MetricCard>
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
            )}
            
            {activeTab === 'payments' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out]">
                    <MetricCard title="Total Payments Disbursed (USD)">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">${stats.totalAwarded.toLocaleString()}</p>
                    </MetricCard>
                     <MetricCard title="Average Payment Amount (USD)">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">${stats.avgPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </MetricCard>
                     <MetricCard title="Payments in Last 30 Days">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">{stats.paymentsLast30Days.toLocaleString()}</p>
                    </MetricCard>

                    <MetricCard title="Payment Volume (Last 30 Days)" className="lg:col-span-2">
                        <PaymentTrendChart data={stats.paymentsOverTime} />
                    </MetricCard>
                     <MetricCard title="Payments by Country (Top 5)">
                        {/* FIX: Use the correct data property for the payment chart. */}
                        <Treemap data={stats.topCountriesByPayment} />
                    </MetricCard>
                    <MetricCard title="Recent Payments" className="lg:col-span-3">
                         <div className="w-full">
                            <table className="min-w-full text-sm text-left">
                                <thead className="text-xs text-gray-200 uppercase">
                                    <tr>
                                        <th className="px-4 py-2">Recipient</th>
                                        <th className="px-4 py-2">Amount (USD)</th>
                                        <th className="px-4 py-2 hidden sm:table-cell">Country</th>
                                        <th className="px-4 py-2 hidden md:table-cell">Event</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#005ca0]/50">
                                    {stats.recentPayments.map(app => (
                                        <tr key={app.id}>
                                            <td className="px-4 py-2 font-medium text-white">{`${app.profileSnapshot.firstName} ${app.profileSnapshot.lastName.charAt(0)}.`}</td>
                                            <td className="px-4 py-2 font-semibold text-[#edda26]">${app.requestedAmount.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-white hidden sm:table-cell">{app.profileSnapshot.primaryAddress.country}</td>
                                            <td className="px-4 py-2 text-white hidden md:table-cell">{app.event}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </MetricCard>
                </div>
            )}

        </div>
    );
};

export default LiveDashboardPage;
