import React from 'react';

interface ApplyExpensesPageProps {
  nextStep: () => void;
  prevStep: () => void;
}

const ApplyExpensesPage: React.FC<ApplyExpensesPageProps> = ({ nextStep, prevStep }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Expenses</h2>
      <p className="text-gray-300">Based on your event details, here are the eligible expenses. (This section will be dynamic in a future update).</p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#005ca0] rounded-lg">
          <thead>
            <tr className="border-b border-[#003a70]">
              <th className="text-left p-3 font-semibold text-white/90">Expense Type</th>
              <th className="text-right p-3 font-semibold text-white/90">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#003a70]">
              <td className="p-3">Shelter</td>
              <td className="text-right p-3">$500.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Back
        </button>
        <button onClick={nextStep} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Next
        </button>
      </div>
    </div>
  );
};

export default ApplyExpensesPage;