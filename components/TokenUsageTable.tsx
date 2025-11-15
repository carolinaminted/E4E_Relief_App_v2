import React from 'react';
import type { TokenUsageTableRow } from '../types';

interface TokenUsageTableProps {
  data: TokenUsageTableRow[];
}

const TokenUsageTable: React.FC<TokenUsageTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="border-b border-[#005ca0] text-xs text-gray-200 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 hidden md:table-cell">User</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Feature</th>
            <th scope="col" className="px-4 py-3 text-right">Input</th>
            <th scope="col" className="px-4 py-3 text-right hidden md:table-cell">Cached</th>
            <th scope="col" className="px-4 py-3 text-right">Output</th>
            <th scope="col" className="px-4 py-3 text-right hidden md:table-cell">Total</th>
            <th scope="col" className="px-4 py-3 text-right">Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
              data.map((row, index) => (
                  <tr key={`${row.user}-${row.session}-${row.feature}-${index}`} className="border-b border-[#005ca0] hover:bg-[#004b8d]/50">
                      <td className="px-4 py-2 font-medium text-white truncate hidden md:table-cell">{row.user}</td>
                      <td className="px-4 py-2 text-white">{row.date}</td>
                      <td className="px-4 py-2 text-white">{row.feature}</td>
                      <td className="px-4 py-2 text-white text-right">{row.input.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right hidden md:table-cell">{row.cached.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right">{row.output.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white font-semibold text-right hidden md:table-cell">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-2 text-[#edda26] font-semibold text-right">${row.cost.toFixed(4)}</td>
                  </tr>
              ))
          ) : (
              <tr>
                  <td colSpan={5} className="text-center py-8 text-white md:hidden">
                      No token usage data found for the selected filters.
                  </td>
                  <td colSpan={8} className="text-center py-8 text-white hidden md:table-cell">
                      No token usage data found for the selected filters.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TokenUsageTable;