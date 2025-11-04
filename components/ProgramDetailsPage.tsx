import React from 'react';
import type { UserProfile } from '../types';
import { getFundByCode } from '../data/fundData';

type Page = 'fundPortal';

interface ProgramDetailsPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <tr className="border-b border-[#005ca0] last:border-b-0">
    <th scope="row" className="p-4 w-1/3 md:w-1/4 font-semibold align-top text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{label}</th>
    <td className="p-4 text-white">{children}</td>
  </tr>
);

const ProgramDetailsPage: React.FC<ProgramDetailsPageProps> = ({ navigate, user }) => {
  const fund = getFundByCode(user.fundCode);

  if (!fund) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center">
        <p className="text-red-400">Could not load program details for fund ({user.fundCode}).</p>
        <button onClick={() => navigate('fundPortal')} className="mt-4 text-[#ff8400] hover:opacity-80">
          Back to Fund Portal
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <button onClick={() => navigate('fundPortal')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Program Details</h1>
      </div>

      <div className="bg-[#003a70]/50 border border-[#005ca0] rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-[#004b8d]">
            <h2 className="text-xl text-center font-semibold text-white">{fund.name} ({fund.code})</h2>
        </div>
        <table className="w-full text-left">
          <tbody>
            <DetailRow label="Verification Type">{fund.cvType}</DetailRow>
            <DetailRow label="Grant Limits">
                <div className="space-y-1">
                    <div>Single Request Max: ${fund.limits.singleRequestMax.toLocaleString()}</div>
                    <div>12-Month Max: ${fund.limits.twelveMonthMax.toLocaleString()}</div>
                    <div>Lifetime Max: ${fund.limits.lifetimeMax.toLocaleString()}</div>
                </div>
            </DetailRow>
            <DetailRow label="Eligible Disasters">
                <div className="flex flex-wrap gap-2">
                    {fund.eligibleDisasters.map(e => <span key={e} className="bg-[#005ca0] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
            <DetailRow label="Eligible Hardships">
                 <div className="flex flex-wrap gap-2">
                    {fund.eligibleHardships.map(e => <span key={e} className="bg-[#005ca0] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
             <DetailRow label="Eligible Employment">
                 <div className="flex flex-wrap gap-2">
                    {fund.eligibleEmploymentTypes.map(e => <span key={e} className="bg-[#005ca0] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramDetailsPage;