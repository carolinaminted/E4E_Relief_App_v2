import React, { useState, useEffect } from 'react';
import { usersRepo, applicationsRepo, fundsRepo } from '../services/firestoreRepo';
import type { Application } from '../types';
import LoadingOverlay from './LoadingOverlay';

type Page = 'fundPortal';

interface LiveDashboardPageProps {
  navigate: (page: Page) => void;
}

// Reusable UI Components from DashboardPage.tsx
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
        return <p className="text-gray-400">No data</p>;
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

const LiveDashboardPage: React.FC<LiveDashboardPageProps> = ({ navigate }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalApplications: 0,
        totalFunds: 0,
        totalAwarded: 0,
        applicationStatusData: [
            { label: 'Awarded', value: 0, color: '#edda26' },
            { label: 'Declined', value: 0, color: '#898c8d' },
            { label: 'In Review', value: 0, color: '#ff8400' },
        ],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all data in parallel
                const [users, applications, funds] = await Promise.all([
                    usersRepo.getAll(),
                    applicationsRepo.getAll(),
                    fundsRepo.getAllFunds()
                ]);

                // Process data for stats
                const totalUsers = users.length;
                const totalApplications = applications.length;
                const totalFunds = funds.length;

                const totalAwarded = applications
                    .filter(app => app.status === 'Awarded')
                    .reduce((sum, app) => sum + app.requestedAmount, 0);

                const statusCounts = applications.reduce((acc, app) => {
                    acc[app.status] = (acc[app.status] || 0) + 1;
                    return acc;
                }, {} as Record<Application['status'], number>);
                
                const applicationStatusData = [
                    { label: 'Awarded', value: statusCounts.Awarded || 0, color: '#edda26' },
                    { label: 'Declined', value: statusCounts.Declined || 0, color: '#898c8d' },
                    { label: 'In Review', value: statusCounts.Submitted || 0, color: '#ff8400' },
                ];

                setStats({
                    totalUsers,
                    totalApplications,
                    totalFunds,
                    totalAwarded,
                    applicationStatusData,
                });

            } catch (error) {
                console.error("Failed to fetch live dashboard data:", error);
                // Optionally set an error state to show in the UI
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <LoadingOverlay message="Fetching Live Data..." />;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="relative flex justify-center items-center mb-8">
                <button onClick={() => navigate('fundPortal')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                </button>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Live Dashboard</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Users">
                    <p className="text-5xl font-extrabold text-white">{stats.totalUsers.toLocaleString()}</p>
                </MetricCard>

                <MetricCard title="Total Funds">
                    <p className="text-5xl font-extrabold text-white">{stats.totalFunds.toLocaleString()}</p>
                </MetricCard>

                <MetricCard title="Total Grant Payments (USD)">
                    <div className="text-center">
                        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">
                            ${stats.totalAwarded.toLocaleString()}
                        </p>
                    </div>
                </MetricCard>
                
                <MetricCard title="Applications by Decision" className="lg:col-span-3">
                    <DonutChart data={stats.applicationStatusData} />
                </MetricCard>
            </div>
        </div>
    );
};

export default LiveDashboardPage;
