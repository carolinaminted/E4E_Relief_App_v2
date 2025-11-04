import React from 'react';
import type { UserProfile } from '../types';
import { getFundByCode } from '../data/fundData';

type Page = 'home' | 'profile';

interface EligibilityPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

const EligibilityPage: React.FC<EligibilityPageProps> = ({ navigate, user }) => {
  const fund = getFundByCode(user.fundCode);

  if (!fund) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center">
        <p className="text-red-400">Could not load eligibility information for your fund ({user.fundCode}).</p>
        <button onClick={() => navigate('home')} className="mt-4 text-[#ff8400] hover:opacity-80">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-6">
        <button onClick={() => navigate('home')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-center text-blue-300 tracking-widest">QUICK CHECK</p>
            <div className="flex items-center gap-4 mt-4 text-center">
                <svg className="w-12 h-12 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl font-bold text-white">Are you eligible for assistance?</h1>
            </div>
        </div>
      </div>

      <p className="text-center text-gray-300 max-w-2xl mx-auto my-8">
        Your program covers the eligibility types and events below - confirm you're eligible before applying.
        You can check your current eligibility status on your <button onClick={() => navigate('profile')} className="font-semibold text-[#ff8400] hover:underline">Profile page</button>.
        An <strong className="text-green-300">'Active'</strong> status means you can apply, while <strong className="text-red-300">'Inactive'</strong> means you may need to complete a verification step first.
      </p>

      <div className="bg-[#003a70]/50 border border-[#005ca0] rounded-lg shadow-lg">
        <div className="bg-[#004b8d] text-center py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white">Eligible</h2>
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-[#005ca0]">
            <tr>
              <th className="p-4 w-1/4 font-semibold text-white/90 align-top">Eligibility Type</th>
              <td className="p-4">
                <ul className="list-disc list-inside text-white space-y-1">
                  {fund.eligibleEmploymentTypes.map(type => <li key={type}>{type}</li>)}
                </ul>
              </td>
            </tr>
            <tr>
              <th className="p-4 w-1/4 font-semibold text-white/90 align-top">Disasters</th>
              <td className="p-4 text-white">
                 <ul className="list-disc list-inside text-white space-y-1">
                  {fund.eligibleDisasters.map(event => <li key={event}>{event}</li>)}
                </ul>
              </td>
            </tr>
            <tr>
              <th className="p-4 w-1/4 font-semibold text-white/90 align-top">Hardships</th>
              <td className="p-4 text-white">
                <ul className="list-disc list-inside text-white space-y-1">
                  {fund.eligibleHardships.map(event => <li key={event}>{event}</li>)}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EligibilityPage;
