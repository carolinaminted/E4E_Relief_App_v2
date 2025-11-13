import React, { useState, useMemo } from 'react';
import type { Application, Page, UserProfile, ClassVerificationStatus } from '../types';
import ApplicationDetailModal from './ApplicationDetailModal';

interface MyApplicationsPageProps {
  navigate: (page: Page) => void;
  applications: Application[];
  userProfile: UserProfile;
  onAddIdentity: (fundCode: string) => void;
}

const EligibilityIndicator: React.FC<{ cvStatus: ClassVerificationStatus, onClick: () => void }> = ({ cvStatus, onClick }) => {
    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors";
    const passedClasses = "bg-green-800/50 text-green-300";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 cursor-pointer hover:bg-yellow-800/80";

    const handleClick = () => {
        if (!hasPassedCV) {
             console.log("[Telemetry] verification_needed_cta_clicked_from_my_applications");
             onClick();
        }
    };

    const text = hasPassedCV ? 'Eligible to apply' : 'Verification needed';
    
    return (
        <button
            onClick={handleClick}
            disabled={hasPassedCV}
            role={hasPassedCV ? 'status' : 'button'}
            aria-label={text}
            className={`${baseClasses} ${hasPassedCV ? passedClasses : neededClasses}`}
        >
            {!hasPassedCV && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            )}
            <span>{text}</span>
        </button>
    );
};


const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ navigate, applications, userProfile, onAddIdentity }) => {
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
            <button onClick={() => navigate('profile')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Profile">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">My Applications</h1>
                {userProfile && (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                    <EligibilityIndicator 
                      cvStatus={userProfile.classVerificationStatus} 
                      onClick={() => onAddIdentity(userProfile.fundCode)} 
                    />
                  </div>
                )}
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