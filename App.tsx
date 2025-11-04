import React, { useState, useCallback, useMemo } from 'react';
import type { UserProfile, Application, EventData, EligibilityDecision } from './types';
import { evaluateApplicationEligibility, getAIAssistedDecision } from './services/geminiService';
// FIX: Corrected the import path for ApplicationFormData. It should be imported from './types' instead of a component file.
import type { ApplicationFormData } from './types';
import { init as initTokenTracker, reset as resetTokenTracker } from './services/tokenTracker';

// Page Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import ApplyPage from './components/ApplyPage';
import ProfilePage from './components/ProfilePage';
import SupportPage from './components/SupportPage';
import SubmissionSuccessPage from './components/SubmissionSuccessPage';
import ChatbotWidget from './components/ChatbotWidget';
import TokenUsagePage from './components/TokenUsagePage';
import FAQPage from './components/FAQPage';
import PaymentOptionsPage from './components/PaymentOptionsPage';


type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions';

// --- MOCK DATABASE ---
const initialUsers: Record<string, UserProfile & { passwordHash: string }> = {
  'user@example.com': {
    // 1a
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@example.com',
    mobileNumber: '555-123-4567',
    // 1b
    primaryAddress: {
      country: 'United States',
      street1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    },
    // 1c
    employmentStartDate: '2020-05-15',
    eligibilityType: 'Full-time',
    householdIncome: 75000,
    householdSize: 4,
    homeowner: 'Yes',
    preferredLanguage: 'English',
    // 1d
    isMailingAddressSame: true,
    // 1e
    ackPolicies: true,
    commConsent: true,
    infoCorrect: true,
    // Auth
    passwordHash: 'password123', // In a real app, this would be a hash
  },
};

const initialApplications: Record<string, Application[]> = {
  'user@example.com': [
    {
      id: 'APP-1001',
      profileSnapshot: initialUsers['user@example.com'], // Snapshot of the user profile
      event: 'Flood',
      eventDate: '2023-08-10',
      requestedAmount: 2500,
      // FIX: Added missing 'evacuated' and 'powerLoss' properties to satisfy the Application type.
      evacuated: 'No',
      powerLoss: 'Yes',
      submittedDate: '2023-08-12',
      status: 'Awarded',
      reasons: ["Application meets all automatic approval criteria."],
      decisionedDate: '2023-08-12',
      twelveMonthGrantRemaining: 7500,
      lifetimeGrantRemaining: 47500,
      shareStory: true,
      receiveAdditionalInfo: false,
    },
  ],
};

const createNewUserProfile = (
    firstName: string,
    lastName: string,
    email: string
): UserProfile => ({
    firstName,
    lastName,
    email,
    mobileNumber: '',
    primaryAddress: { country: '', street1: '', city: '', state: '', zip: '' },
    employmentStartDate: '',
    eligibilityType: '',
    householdIncome: '',
    householdSize: '',
    homeowner: '',
    isMailingAddressSame: null,
    ackPolicies: false,
    commConsent: false,
    infoCorrect: false,
});


// --- END MOCK DATABASE ---

function App() {
  const [page, setPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [applications, setApplications] = useState(initialApplications);
  const [lastSubmittedApp, setLastSubmittedApp] = useState<Application | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<Partial<ApplicationFormData> | null>(null);


  const userApplications = useMemo(() => {
    if (currentUser) {
      return applications[currentUser.email] || [];
    }
    return [];
  }, [currentUser, applications]);

  const handleLogin = useCallback((email: string, password: string): boolean => {
    const user = users[email];
    if (user && user.passwordHash === password) {
      const { passwordHash, ...profile } = user;
      setCurrentUser(profile);
      initTokenTracker(profile);
      setPage('home');
      return true;
    }
    return false;
  }, [users]);
  
  const handleRegister = useCallback((firstName: string, lastName: string, email: string, password: string): boolean => {
    if (users[email]) {
      return false; // User already exists
    }
    const newUserProfile = createNewUserProfile(firstName, lastName, email);
    const newUser = {
      ...newUserProfile,
      passwordHash: password,
    };
    setUsers(prev => ({ ...prev, [email]: newUser }));
    setApplications(prev => ({ ...prev, [email]: [] }));
    setCurrentUser(newUserProfile);
    initTokenTracker(newUserProfile);
    setPage('home');
    return true;
  }, [users]);

  const handleLogout = () => {
    setCurrentUser(null);
    resetTokenTracker();
    setPage('login');
  };
  
  const navigate = useCallback((targetPage: Page) => {
    setPage(targetPage);
  }, []);
  
  const handleProfileUpdate = useCallback((updatedProfile: UserProfile) => {
    if (!currentUser) return;

    setCurrentUser(updatedProfile);
    setUsers(prev => {
        const currentUserData = prev[currentUser.email];
        if (currentUserData) {
            return {
                ...prev,
                [currentUser.email]: {
                    ...currentUserData, // a.k.a. passwordHash
                    ...updatedProfile,
                }
            };
        }
        return prev;
    });
    // Maybe show a success message
  }, [currentUser]);

  const handleApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser) return;
    
    const tempId = `APP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const usersPastApplications = applications[currentUser.email] || [];
    const lastApplication = usersPastApplications.length > 0 ? usersPastApplications[usersPastApplications.length - 1] : null;
    
    const initialTwelveMonthMax = 10000;
    const initialLifetimeMax = 50000;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;

    // Step 1: Call the local rules engine to get a preliminary decision
    const preliminaryDecision = evaluateApplicationEligibility({
        id: tempId,
        employmentStartDate: appFormData.profileData.employmentStartDate,
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining: currentTwelveMonthRemaining,
        currentLifetimeRemaining: currentLifetimeRemaining,
    });
    
    console.log("Preliminary Rules Engine Decision:", preliminaryDecision);

    // Step 2: Send the preliminary decision and application data to the AI for a final review
    const finalDecision = await getAIAssistedDecision(
      { 
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining: currentTwelveMonthRemaining,
        currentLifetimeRemaining: currentLifetimeRemaining,
      },
      preliminaryDecision
    );

    console.log("Final AI-Assisted Decision:", finalDecision);


    const getStatusFromDecision = (decision: EligibilityDecision['decision']): Application['status'] => {
        if (decision === 'Approved') return 'Awarded';
        if (decision === 'Denied') return 'Declined';
        return 'Submitted'; // for 'Review'
    };

    const newApplication: Application = {
      id: tempId,
      profileSnapshot: appFormData.profileData,
      ...appFormData.eventData,
      evacuated: appFormData.eventData.evacuated || '',
      evacuatingFromPrimary: appFormData.eventData.evacuatingFromPrimary || undefined,
      stayedWithFamilyOrFriend: appFormData.eventData.stayedWithFamilyOrFriend || undefined,
      powerLoss: appFormData.eventData.powerLoss || '',
      evacuationNights: appFormData.eventData.evacuationNights || undefined,
      powerLossDays: appFormData.eventData.powerLossDays || undefined,
      submittedDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
    };

    setApplications(prev => ({
      ...prev,
      [currentUser.email]: [...(prev[currentUser.email] || []), newApplication],
    }));
    
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(currentUser)) {
        handleProfileUpdate(appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');

  }, [currentUser, handleProfileUpdate, applications]);
  
  const handleChatbotAction = useCallback((functionName: string, args: any) => {
    console.log(`Executing tool: ${functionName}`, args);
    setApplicationDraft(prevDraft => {
        const newDraft = { ...prevDraft };

        if (functionName === 'updateUserProfile') {
            const prevProfile: Partial<UserProfile> = prevDraft?.profileData || {};
            const newProfile = { ...prevProfile, ...args };

            if (args.primaryAddress) {
                newProfile.primaryAddress = {
                    ...(prevProfile.primaryAddress || {}),
                    ...args.primaryAddress
                };
            }
            newDraft.profileData = newProfile as UserProfile;
        }

        if (functionName === 'startOrUpdateApplicationDraft') {
            const prevEventData: Partial<EventData> = prevDraft?.eventData || {};
            newDraft.eventData = { ...prevEventData, ...args };
        }
        return newDraft;
    });
  }, []);

  const renderPage = () => {
    if (!currentUser) {
      return (
        <>
          <div className="w-full flex justify-center items-center h-[35vh]">
            <img 
              src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi" 
              alt="E4E Relief Logo" 
              className="mx-auto h-48 w-auto"
            />
          </div>
          
          <div className="w-full max-w-md">
            {page === 'register' ? (
              <RegisterPage onRegister={handleRegister} switchToLogin={() => setPage('login')} />
            ) : (
              <LoginPage onLogin={handleLogin} switchToRegister={() => setPage('register')} />
            )}
          </div>
        </>
      );
    }
    
    switch (page) {
      case 'apply':
        return <ApplyPage navigate={navigate} onSubmit={handleApplicationSubmit} userProfile={currentUser} applicationDraft={applicationDraft} />;
      case 'profile':
        return <ProfilePage navigate={navigate} applications={userApplications} userProfile={currentUser} onProfileUpdate={handleProfileUpdate} />;
      case 'support':
        return <SupportPage navigate={navigate} />;
       case 'tokenUsage':
        return <TokenUsagePage navigate={navigate} currentUser={currentUser} />;
      case 'submissionSuccess':
        if (!lastSubmittedApp) return <HomePage navigate={navigate} />;
        return <SubmissionSuccessPage application={lastSubmittedApp} onGoToProfile={() => setPage('profile')} />;
      case 'faq':
        return <FAQPage navigate={navigate} />;
      case 'paymentOptions':
        return <PaymentOptionsPage navigate={navigate} />;
      case 'home':
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="bg-[#003a70] text-white min-h-screen font-sans flex flex-col">
      {currentUser && (
        <header className="bg-[#004b8d]/80 backdrop-blur-sm p-4 flex justify-between items-center shadow-md sticky top-0 z-30 border-b border-[#002a50]">
          <button onClick={() => navigate('home')} className="flex items-center transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
            <img
              src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
              alt="E4E Relief Logo"
              className="h-10 w-auto"
            />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-gray-200">Welcome, {currentUser.firstName}</span>
            <button onClick={handleLogout} className="bg-[#ff8400]/80 hover:bg-[#ff8400] text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
              Logout
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col ${!currentUser ? 'items-center' : ''}`}>
        {renderPage()}
      </main>

      {currentUser && <ChatbotWidget applications={userApplications} onChatbotAction={handleChatbotAction} />}
    </div>
  );
}

export default App;