import React, { useState, useMemo } from 'react';
import type { Application, Page } from '../types';
import ApplicationDetailModal from './ApplicationDetailModal';

interface MyApplicationsPageProps {
  navigate: (page: 'profile') => void;
  applications: Application[];
  activeFundName: string | undefined;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ navigate, applications, activeFundName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const sortedApplications = useMemo(() => {
    return [...applications].reverse(); // Newest first
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm) {
      return sortedApplications;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedApplications.filter(app => {
        const submittedDateTime = `${new Date(app.submittedDate).toLocaleDateString('en-CA')} at ${new Date(app.submittedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', hour12: true })}`;
        return (
            app.event.toLowerCase().includes(lowercasedFilter) ||
            (app.otherEvent && app.otherEvent.toLowerCase().includes(lowercasedFilter)) ||
            app.status.toLowerCase().includes(lowercasedFilter) ||
            app.id.toLowerCase().includes(lowercasedFilter) ||
            submittedDateTime.toLowerCase().includes(lowercasedFilter)
        );
    });
  }, [sortedApplications, searchTerm]);

  return (
    <>
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('profile')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Profile">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">My Applications</h1>
                {activeFundName && <p className="text-lg text-gray-300">{activeFundName}</p>}
            </div>
        </div>
        
        <div className="mb-6">
            <input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by event, status, date..."
                className="w-full bg-[#004b8d]/50 border border-[#005ca0] rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff8400] focus:border-transparent"
            />
        </div>

        <div className="space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map(app => (
              <button key={app.id} onClick={() => setSelectedApplication(app)} className="w-full text-left bg-[#004b8d] p-4 rounded-md flex justify-between items-center hover:bg-[#005ca0]/50 transition-colors duration-200">
                <div>
                  <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{app.event === 'My disaster is not listed' ? app.otherEvent : app.event}</p>
                  <p className="text-sm text-gray-300">Submitted: {new Date(app.submittedDate).toLocaleDateString('en-CA')} at {new Date(app.submittedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', hour12: true })}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${app.requestedAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-300">Status: <span className={`font-medium ${statusStyles[app.status]}`}>{app.status}</span></p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 bg-[#003a70]/50 rounded-lg">
              <p className="text-gray-300">{searchTerm ? 'No applications match your search.' : 'You have not submitted any applications for this fund yet.'}</p>
            </div>
          )}
        </div>
      </div>
      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication} 
          onClose={() => setSelectedApplication(null)} 
        />
      )}
    </>
  );
};

export default MyApplicationsPage;