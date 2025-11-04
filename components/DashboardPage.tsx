import React from 'react';

type Page = 'fundPortal';

interface DashboardPageProps {
  navigate: (page: Page) => void;
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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 w-full">
      <div className="relative">
        <svg width="150" height="150" viewBox="0 0 120 120" className="transform -rotate-90">
          {data.map((item, index) => {
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


const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  // --- Official Color Palette ---
  const chartColors = ['#ff8400', '#edda26', '#0091b3', '#94d600', '#d4d756'];
  const grayColor = '#898c8d';

  // --- Mock Data ---
  const applicationStatusData = [
    { label: 'Awarded', value: 125, color: chartColors[1] }, // yellow: #edda26
    { label: 'Declined', value: 42, color: grayColor },      // gray: #898c8d
    { label: 'In Review', value: 18, color: chartColors[0] }, // orange: #ff8400
  ];

  const totalAwarded = 789500;

  const userEngagementData = [
    { label: 'Donated', value: 89, color: chartColors[2] }, // teal: #0091b3
    { label: 'Applied', value: 215, color: chartColors[0] }, // orange: #ff8400
    { label: 'Not Engaged', value: 450, color: grayColor }, // gray: #898c8d
  ];

  const topCountriesData = [
      { label: 'United States', value: 450 },
      { label: 'Canada', value: 120 },
      { label: 'United Kingdom', value: 95 },
      { label: 'Mexico', value: 78 },
      { label: 'India', value: 62 },
  ];

  const recentUsersData = [
      { name: 'Olivia Chen', email: 'olivia.c@example.com', fund: 'E4E' },
      { name: 'Benjamin Carter', email: 'ben.carter@example.com', fund: 'JHH' },
      { name: 'Sophia Rodriguez', email: 'sophia.r@example.com', fund: 'E4E' },
      { name: 'Liam Goldberg', email: 'liam.g@example.com', fund: 'SQRT' },
      { name: 'Ava Nguyen', email: 'ava.n@example.com', fund: 'JHH' },
  ];

  const topEventsData = [
      { label: 'Hurricane', value: 85 },
      { label: 'Wildfire', value: 62 },
      { label: 'Household Loss', value: 45 },
      { label: 'Flood', value: 31 },
      { label: 'Winter Storm', value: 22 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('fundPortal')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Total Grant Payments (USD)">
                <div className="text-center">
                    <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">
                        ${totalAwarded.toLocaleString()}
                    </p>
                </div>
            </MetricCard>

            <MetricCard title="Applications by Decision">
                 <DonutChart data={applicationStatusData} />
            </MetricCard>

             <MetricCard title="User Engagement">
                <DonutChart data={userEngagementData} />
            </MetricCard>

            <MetricCard title="Top 5 Countries by Users">
                <HorizontalBarChartList data={topCountriesData} colors={chartColors} />
            </MetricCard>

            <MetricCard title="Top 5 Apps by Event Type">
                <HorizontalBarChartList data={topEventsData} colors={chartColors} />
            </MetricCard>

            <MetricCard title="Recently Registered Users">
                <div className="space-y-2 w-full">
                    {recentUsersData.map((user, index) => (
                        <div key={index} className="grid grid-cols-10 gap-2 text-sm p-2 rounded hover:bg-[#004b8d]/50">
                            <span className="text-white truncate col-span-4">{user.name}</span>
                            <span className="text-gray-300 truncate col-span-4">{user.email}</span>
                            <span className="text-white font-mono text-right col-span-2">{user.fund}</span>
                        </div>
                    ))}
                </div>
            </MetricCard>
        </div>
    </div>
  );
};

export default DashboardPage;