import React from 'react';
import type { TokenUsageTableRow } from '../types';

interface TokenUsageTableProps {
  data: TokenUsageTableRow[];
}

const TokenUsageTable: React.FC<TokenUsageTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full text-sm text-left">
        <thead className="border-b border-[#005ca0] text-xs text-gray-200 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">User</th>
            <th scope="col" className="px-4 py-3">Fund</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Feature</th>
            <th scope="col" className="px-4 py-3 text-right">Input</th>
            <th scope="col" className="px-4 py-3 text-right">Cached</th>
            <th scope="col" className="px-4 py-3 text-right">Output</th>
            <th scope="col" className="px-4 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3 text-right">Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
              data.map((row, index) => (
                  <tr key={`${row.user}-${row.session}-${row.feature}-${index}`} className="border-b border-[#005ca0] hover:bg-[#004b8d]/50">
                      <td className="px-4 py-2 font-medium text-white truncate" title={row.user}>{row.userName}</td>
                      <td className="px-4 py-2 text-white font-mono">{row.fundCode}</td>
                      <td className="px-4 py-2 text-white">{row.date}</td>
                      <td className="px-4 py-2 text-white">{row.feature}</td>
                      <td className="px-4 py-2 text-white text-right">{row.input.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right">{row.cached.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right">{row.output.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white font-semibold text-right">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-2 text-[#edda26] font-semibold text-right">${row.cost.toFixed(4)}</td>
                  </tr>
              ))
          ) : (
              <tr>
                  <td colSpan={9} className="text-center py-8 text-white">
                      No token usage data found.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TokenUsageTable;