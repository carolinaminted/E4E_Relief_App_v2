import React from 'react';
import type { TopSessionData, LastHourUsageDataPoint } from '../types';

const Bar: React.FC<{ value: number, total: number, color: string, label: string }> = ({ value, total, color, label }) => {
    if (value === 0 || total === 0) return null;
    const percentage = (value / total) * 100;
    return (
        <div style={{ width: `${percentage}%`, backgroundColor: color }} className="h-full flex items-center justify-center text-xs font-bold text-white text-shadow-sm transition-all duration-300" title={`${label}: ${value.toLocaleString()}`}>
            <span className="truncate px-1">{value.toLocaleString()}</span>
        </div>
    );
};

export const TopSessionChart: React.FC<{ topSession: TopSessionData | null }> = ({ topSession }) => {
    if (!topSession) {
        return <p className="text-white text-center py-4">No session data available to display.</p>;
    }
    
    return (
        <>
            <p className="text-sm text-gray-200 mb-1">Session ID: <span className="font-mono text-white">{topSession.sessionId}</span></p>
            <div className="w-full h-8 bg-[#003a70] rounded-md flex overflow-hidden border border-[#005ca0]">
                <Bar value={topSession.inputTokens} total={topSession.totalTokens} color="#005ca0" label="Input" />
                <Bar value={topSession.cachedInputTokens} total={topSession.totalTokens} color="#007bff" label="Cached Input" />
                <Bar value={topSession.outputTokens} total={topSession.totalTokens} color="#ff8400" label="Output" />
            </div>
            <div className="flex justify-end gap-4 mt-2 text-xs">
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#005ca0] mr-1"></span> Input</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#007bff] mr-1"></span> Cached</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#ff8400] mr-1"></span> Output</div>
            </div>
        </>
    );
};

export const LastHourUsageChart: React.FC<{ usage: LastHourUsageDataPoint[] }> = ({ usage }) => {
    const maxValue = Math.max(...usage.map(d => d.totalTokens));
    const hasData = usage.some(d => d.totalTokens > 0);

    if (!hasData) {
        return <p className="text-white text-center py-4">No token usage recorded in the last hour.</p>;
    }

    const yAxisMax = Math.max(500, Math.ceil(maxValue / 500) * 500);

    const width = 500;
    const height = 200;
    const padding = 40;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding;

    const tokensToY = (tokens: number) => height - (Math.min(tokens, yAxisMax) / yAxisMax) * usableHeight - (padding / 2);
    const dateToX = (index: number) => (index / (usage.length - 1)) * usableWidth + padding;
    
    const points = usage.map((d, i) => `${dateToX(i)},${tokensToY(d.totalTokens)}`).join(' ');

    const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
        const value = Math.round((yAxisMax / 4) * i);
        return {
            value,
            y: tokensToY(value)
        };
    });

    const xAxisLabels = [
        { value: "-60m", x: dateToX(0) },
        { value: "-45m", x: dateToX(15) },
        { value: "-30m", x: dateToX(30) },
        { value: "-15m", x: dateToX(45) },
        { value: "Now",  x: dateToX(60) },
    ];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {yAxisLabels.map(({ value, y }) => (
                <g key={value}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#005ca0" strokeWidth="1" />
                    <text x={padding - 5} y={y + 3} fill="#9ca3af" textAnchor="end" fontSize="10">
                        {value >= 1000 ? `${(value/1000).toFixed(1).replace('.0', '')}k` : value}
                    </text>
                </g>
            ))}

            {xAxisLabels.map(({ value, x }, index) => (
                <text key={index} x={x} y={height - 5} fill="#9ca3af" textAnchor="middle" fontSize="10">{value}</text>
            ))}
            
            <polyline points={points} fill="none" stroke="#ff8400" strokeWidth="2" />
        </svg>
    );
};

export const Last15MinutesUsageChart: React.FC<{ usage: LastHourUsageDataPoint[] }> = ({ usage }) => {
    const maxValue = Math.max(...usage.map(d => d.totalTokens));
    const hasData = usage.some(d => d.totalTokens > 0);

    if (!hasData) {
        return <p className="text-white text-center py-4">No token usage recorded in the last 15 minutes.</p>;
    }

    const yAxisMax = Math.max(500, Math.ceil(maxValue / 500) * 500);

    const width = 500;
    const height = 200;
    const padding = 40;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding;

    const tokensToY = (tokens: number) => height - (Math.min(tokens, yAxisMax) / yAxisMax) * usableHeight - (padding / 2);
    // There are 16 points (0 to 15), so usage.length - 1 = 15
    const dateToX = (index: number) => (index / (usage.length - 1)) * usableWidth + padding;
    
    const points = usage.map((d, i) => `${dateToX(i)},${tokensToY(d.totalTokens)}`).join(' ');

    const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
        const value = Math.round((yAxisMax / 4) * i);
        return {
            value,
            y: tokensToY(value)
        };
    });

    const xAxisLabels = [
        { value: "-15m", x: dateToX(0) },
        { value: "-10m", x: dateToX(5) },
        { value: "-5m", x: dateToX(10) },
        { value: "Now",  x: dateToX(15) },
    ];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {yAxisLabels.map(({ value, y }) => (
                <g key={value}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#005ca0" strokeWidth="1" />
                    <text x={padding - 5} y={y + 3} fill="#9ca3af" textAnchor="end" fontSize="10">
                        {value >= 1000 ? `${(value/1000).toFixed(1).replace('.0', '')}k` : value}
                    </text>
                </g>
            ))}

            {xAxisLabels.map(({ value, x }, index) => (
                <text key={index} x={x} y={height - 5} fill="#9ca3af" textAnchor="middle" fontSize="10">{value}</text>
            ))}
            
            <polyline points={points} fill="none" stroke="#ff8400" strokeWidth="2" />
        </svg>
    );
};