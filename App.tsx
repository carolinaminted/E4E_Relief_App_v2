

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { User, IdTokenResult } from 'firebase/auth';
import type { UserProfile, Application, EventData, EligibilityDecision, ClassVerificationStatus, IdentityEligibility, EligibilityStatus, FundIdentity, ActiveIdentity } from './types';
import { evaluateApplicationEligibility, getAIAssistedDecision } from './services/geminiService';
import type { ApplicationFormData } from './types';
import { init as initTokenTracker, reset as resetTokenTracker } from './services/tokenTracker';
import { authClient } from './services/firebaseAuthClient';
import { usersRepo, identitiesRepo, applicationsRepo, fundsRepo } from './services/firestoreRepo';

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
import DonatePage from './components/DonatePage';
import EligibilityPage from './components/EligibilityPage';
import FundPortalPage from './components/FundPortalPage';
import DashboardPage from './components/DashboardPage';
import TicketingPage from './components/TicketingPage';
import ProgramDetailsPage from './components/ProgramDetailsPage';
import ProxyApplyPage from './components/ProxyPage';
import ClassVerificationPage from './components/ClassVerificationPage';
import LoadingOverlay from './components/LoadingOverlay';

type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

type AuthState = {
    status: 'loading' | 'signedIn' | 'signedOut';
    user: User | null;
    profile: UserProfile | null;
    claims: { admin?: boolean };
};

function App() {
  const [page, setPage] = useState<Page>('login');
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading', user: null, profile: null, claims: {} });
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [proxyApplications, setProxyApplications] = useState<Application[]>([]);
  const [allIdentities, setAllIdentities] = useState<FundIdentity[]>([]);
  const [activeIdentity, setActiveIdentity] = useState<ActiveIdentity | null>(null);
  
  const [verifyingFundCode, setVerifyingFundCode] = useState<string | null>(null);
  const [lastSubmittedApp, setLastSubmittedApp] = useState<Application | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<Partial<ApplicationFormData> | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = authClient.onAuthStateChanged((user, token) => {
      // Clean up any existing profile listener when auth state changes.
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (user && token) {
        const claims = (token.claims as { admin?: boolean }) || {};
        
        // Set a listener on the user's profile document.
        profileUnsubscribe = usersRepo.listen(user.uid, async (profile) => {
          if (profile) {
            // --- Profile found, hydrate the full application state ---
            const identities = await identitiesRepo.getForUser(user.uid);
            const userApps = await applicationsRepo.getForUser(user.uid);

            let activeId: FundIdentity | undefined = undefined;
            if (identities.length > 0) {
              activeId = identities.find(id => id.id === profile.activeIdentityId) ||
                         [...identities].sort((a, b) => new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime())[0];
            }

            let hydratedProfile: UserProfile;
            if (activeId) {
              hydratedProfile = {
                ...profile,
                fundCode: activeId.fundCode,
                fundName: activeId.fundName,
                classVerificationStatus: activeId.classVerificationStatus,
                eligibilityStatus: activeId.eligibilityStatus,
              };
              setActiveIdentity({ id: activeId.id, fundCode: activeId.fundCode });
            } else {
              // User has a profile but no identities yet.
              hydratedProfile = profile;
            }

            setAllIdentities(identities);
            setApplications(userApps);
            setAuthState({ status: 'signedIn', user, profile: hydratedProfile, claims });
            initTokenTracker(hydratedProfile);

            if (claims.admin) {
              const proxyApps = await applicationsRepo.getProxySubmissions(user.uid);
              setProxyApplications(proxyApps);
            }

            // Navigation logic based on the hydrated profile state
            if (hydratedProfile.classVerificationStatus !== 'passed' || hydratedProfile.eligibilityStatus !== 'Eligible') {
              setPage('classVerification');
            } else {
              // Only navigate to home if not already on a specific page (prevents overriding navigation)
              setPage(prevPage => (prevPage === 'login' || prevPage === 'register' || prevPage === 'classVerification' ? 'home' : prevPage));
            }
          } else {
            // --- Profile not found ---
            const creationTime = new Date(user.metadata.creationTime || 0).getTime();
            // Check if the user was created within the last 10 seconds.
            const isNewUser = (Date.now() - creationTime) < 10000;

            if (isNewUser) {
              // This is a new user registration. The profile document is being created.
              // We do nothing and wait. The listener will fire again when the document appears.
              // The UI will show the main loading overlay because authState.profile is null.
              setAuthState({ status: 'loading', user, profile: null, claims });
            } else {
              // This is an existing user whose profile document is missing. This is an error state.
              console.error("User profile not found for an existing user. Signing out.");
              authClient.signOut();
            }
          }
        });
      } else {
        // --- User is signed out ---
        setAuthState({ status: 'signedOut', user: null, profile: null, claims: {} });
        setCurrentUser(null);
        setPage('login');
        resetTokenTracker();
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const currentUser = authState.profile;

  const userIdentities = useMemo(() => {
    if (!currentUser) return [];
    return allIdentities.filter(id => id.uid === currentUser.uid);
  }, [currentUser, allIdentities]);

  const userApplications = useMemo(() => {
    if (currentUser && activeIdentity) {
      return applications.filter(app => app.profileSnapshot.fundCode === activeIdentity.fundCode) || [];
    }
    return [];
  }, [currentUser, applications, activeIdentity]);
  
  const isApplyEnabled = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.classVerificationStatus === 'passed' && currentUser.eligibilityStatus === 'Eligible';
  }, [currentUser]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [page]);

  const setCurrentUser = (profile: UserProfile | null) => {
      setAuthState(prev => ({...prev, profile}));
  }

  const handleSetActiveIdentity = useCallback(async (identityId: string) => {
    if (!currentUser) return;

    const identityToActivate = allIdentities.find(i => i.id === identityId);
    if (identityToActivate && identityToActivate.eligibilityStatus === 'Eligible') {
        console.log(`[Telemetry] track('IdentitySwitch', { from: ${activeIdentity?.fundCode}, to: ${identityToActivate.fundCode} })`);
        
        await identitiesRepo.update(identityId, { lastUsedAt: new Date().toISOString() });
        await usersRepo.update(currentUser.uid, { activeIdentityId: identityId });

        setActiveIdentity({ id: identityToActivate.id, fundCode: identityToActivate.fundCode });

        setCurrentUser({
            ...currentUser,
            fundCode: identityToActivate.fundCode,
            fundName: identityToActivate.fundName,
            classVerificationStatus: identityToActivate.classVerificationStatus,
            eligibilityStatus: identityToActivate.eligibilityStatus,
        });
        
        // Refresh identities list to reflect lastUsedAt change for sorting
        const updatedIdentities = await identitiesRepo.getForUser(currentUser.uid);
        setAllIdentities(updatedIdentities);
    }
  }, [currentUser, allIdentities, activeIdentity]);
  
  const handleLogout = () => {
    authClient.signOut();
  };
  
  const navigate = useCallback((targetPage: Page) => {
    if (targetPage === 'apply' && !isApplyEnabled) {
        console.log("Gating 'apply' page. User not verified or not eligible.");
        setPage('classVerification');
    } else {
        setPage(targetPage);
    }
  }, [isApplyEnabled]);

  const handleStartAddIdentity = useCallback(async (fundCode: string) => {
    if (!currentUser) return;
    
    const identity = allIdentities.find(id => id.uid === currentUser.uid && id.fundCode === fundCode);
    if (identity && identity.eligibilityStatus === 'Eligible') {
        alert(`Your identity for fund code ${fundCode} is already eligible.`);
        return;
    }

    if (identity) {
        console.log(`[Telemetry] track('IdentityReverifyStarted', { fundCode: ${fundCode} })`);
    } else {
        console.log(`[Telemetry] track('AddIdentityStarted', { fundCode: ${fundCode} })`);
    }

    setVerifyingFundCode(fundCode);
    setPage('classVerification');
  }, [currentUser, allIdentities]);

  const handleRemoveIdentity = useCallback(async (identityId: string) => {
    if (!currentUser) return;
    const identityToRemove = allIdentities.find(id => id.id === identityId);
    if (!identityToRemove) return;

    if (activeIdentity?.id === identityId) {
        alert("You cannot remove your active identity.");
        return;
    }

    if (window.confirm(`Are you sure you want to remove the identity for ${identityToRemove.fundName}?`)) {
        console.log(`[Telemetry] track('IdentityRemove', { fundCode: ${identityToRemove.fundCode} })`);
        await identitiesRepo.remove(identityId);
        setAllIdentities(prev => prev.filter(id => id.id !== identityId));
    }
  }, [currentUser, allIdentities, activeIdentity]);

  const handleVerificationSuccess = useCallback(async () => {
    if (!currentUser) return;

    const userExistingIdentities = allIdentities;
    const fundCodeToVerify = verifyingFundCode || currentUser.fundCode;
    const fund = await fundsRepo.getFund(fundCodeToVerify);
    
    if (!fund) {
        console.error("Verification successful but could not find fund config for", fundCodeToVerify);
        setVerifyingFundCode(null);
        setPage('profile');
        return;
    }
    
    const identityIdToUpdate = `${currentUser.uid}-${fund.code}`;
    const existingIdentity = userExistingIdentities.find(id => id.id === identityIdToUpdate);
    let newActiveIdentity: FundIdentity;

    const updates = { 
        eligibilityStatus: 'Eligible' as EligibilityStatus, 
        classVerificationStatus: 'passed' as ClassVerificationStatus,
        lastUsedAt: new Date().toISOString()
    };

    if (existingIdentity) {
        console.log(`[Telemetry] track('IdentityReverified', { fundCode: ${fund.code} })`);
        await identitiesRepo.update(identityIdToUpdate, updates);
        newActiveIdentity = { ...existingIdentity, ...updates };
    } else {
        console.log(`[Telemetry] track('IdentityCreated', { fundCode: ${fund.code}, cvType: ${fund.cvType} })`);
        newActiveIdentity = {
            id: identityIdToUpdate,
            uid: currentUser.uid,
            fundCode: fund.code,
            fundName: fund.name,
            cvType: fund.cvType,
            eligibilityStatus: 'Eligible',
            classVerificationStatus: 'passed',
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
        };
        await identitiesRepo.add(newActiveIdentity);
    }
    
    // This update will trigger the onSnapshot listener to re-hydrate the app state and navigate.
    await usersRepo.update(currentUser.uid, { activeIdentityId: newActiveIdentity.id });
    setVerifyingFundCode(null);

  }, [currentUser, verifyingFundCode, allIdentities]);
  
  const handleProfileUpdate = useCallback(async (updatedProfile: UserProfile) => {
    if (!currentUser) return;
    // The onSnapshot listener will automatically update the UI state from this write.
    await usersRepo.update(currentUser.uid, updatedProfile);
    alert('Profile saved!');
  }, [currentUser]);

  const handleApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser) return;
    
    const usersPastApplications = applications || [];
    const lastApplication = usersPastApplications.length > 0 ? usersPastApplications.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0] : null;
    
    const fund = await fundsRepo.getFund(currentUser.fundCode);
    const initialTwelveMonthMax = fund?.limits?.twelveMonthMax ?? 10000;
    const initialLifetimeMax = fund?.limits?.lifetimeMax ?? 50000;
    const singleRequestMax = fund?.limits?.singleRequestMax ?? 10000;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp',
        employmentStartDate: appFormData.profileData.employmentStartDate,
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining,
        currentLifetimeRemaining,
        singleRequestMax,
    });
    
    const finalDecision = await getAIAssistedDecision(
      { eventData: appFormData.eventData, currentTwelveMonthRemaining, currentLifetimeRemaining },
      preliminaryDecision
    );

    const getStatusFromDecision = (decision: EligibilityDecision['decision']): Application['status'] => {
        if (decision === 'Approved') return 'Awarded';
        if (decision === 'Denied') return 'Declined';
        return 'Submitted';
    };

    const newApplicationData: Omit<Application, 'id'> = {
      uid: currentUser.uid,
      profileSnapshot: appFormData.profileData,
      ...appFormData.eventData,
      submittedDate: new Date().toLocaleDateString('en-CA'),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);

    setApplications(prev => [...prev, newApplication]);
    
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(currentUser)) {
        await handleProfileUpdate(appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');

  }, [currentUser, handleProfileUpdate, applications]);
  
  const handleProxyApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser || authState.claims.admin !== true) {
        console.error("Only admins can submit proxy applications.");
        return;
    };

    const applicantEmail = appFormData.profileData.email?.toLowerCase();
    if (!applicantEmail) {
        alert("Applicant email is required to submit a proxy application.");
        return;
    }

    let applicantProfile = await usersRepo.getByEmail(applicantEmail);

    if (!applicantProfile) {
        // Create a new user if they don't exist
        const { user } = await authClient.createProxyUser(applicantEmail, 'password123'); // Default password
        const newProfileData = {
            ...appFormData.profileData,
            uid: user.uid,
            email: applicantEmail,
            role: 'User' as 'User',
            activeIdentityId: null,
        };
        await usersRepo.add(newProfileData, user.uid);
        applicantProfile = newProfileData;
    }
    
    if (!applicantProfile) { // Should not happen
        alert("Failed to find or create applicant profile.");
        return;
    }

    const applicantPastApps = await applicationsRepo.getForUser(applicantProfile.uid);
    const lastApplication = applicantPastApps.length > 0 ? applicantPastApps.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0] : null;
    
    const fund = await fundsRepo.getFund(appFormData.profileData.fundCode);
    const initialTwelveMonthMax = fund?.limits?.twelveMonthMax ?? 10000;
    const initialLifetimeMax = fund?.limits?.lifetimeMax ?? 50000;
    const singleRequestMax = fund?.limits?.singleRequestMax ?? 10000;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp', employmentStartDate: appFormData.profileData.employmentStartDate, eventData: appFormData.eventData,
        currentTwelveMonthRemaining, currentLifetimeRemaining, singleRequestMax,
    });
    
    const finalDecision = await getAIAssistedDecision(
      { eventData: appFormData.eventData, currentTwelveMonthRemaining, currentLifetimeRemaining },
      preliminaryDecision
    );

    const getStatusFromDecision = (decision: EligibilityDecision['decision']): Application['status'] => {
        if (decision === 'Approved') return 'Awarded'; if (decision === 'Denied') return 'Declined'; return 'Submitted';
    };

    const newApplicationData: Omit<Application, 'id'> = {
      uid: applicantProfile.uid,
      profileSnapshot: appFormData.profileData,
      ...appFormData.eventData,
      submittedDate: new Date().toLocaleDateString('en-CA'),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);
    setProxyApplications(prev => [...prev, newApplication]);
    
    // Update profile if changed
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(applicantProfile)) {
        await usersRepo.update(applicantProfile.uid, appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');
  }, [currentUser, authState.claims.admin]);

  const handleChatbotAction = useCallback((functionName: string, args: any) => {
    console.log(`Executing tool: ${functionName}`, args);
    setApplicationDraft(prevDraft => {
        const newDraft = { ...prevDraft };

        if (functionName === 'updateUserProfile') {
            const prevProfile: Partial<UserProfile> = prevDraft?.profileData || {};
            const newProfile = { ...prevProfile, ...args };

            if (args.primaryAddress) {
                newProfile.primaryAddress = { ...(prevProfile.primaryAddress || {}), ...args.primaryAddress };
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
    if (authState.status === 'loading' || (authState.status === 'signedIn' && !currentUser)) {
      return <LoadingOverlay message="Authenticating..." />;
    }
    
    if (authState.status === 'signedOut') {
      return (
        <>
          <div className="w-full flex justify-center items-center py-12">
            <img 
              src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi" 
              alt="E4E Relief Logo" 
              className="mx-auto h-32 w-auto"
            />
          </div>
          <div className="w-full max-w-md px-4 pb-8">
            {page === 'register' ? (
              <RegisterPage onRegister={authClient.register} switchToLogin={() => setPage('login')} />
            ) : (
              <LoginPage onLogin={authClient.signIn} switchToRegister={() => setPage('register')} />
            )}
          </div>
        </>
      );
    }
    
    // This case should now be covered by the loading overlay above, but as a fallback:
    if (!currentUser) return <LoadingOverlay message="Loading Profile..." />;

    switch (page) {
      case 'classVerification':
        return <ClassVerificationPage user={currentUser} onVerificationSuccess={handleVerificationSuccess} navigate={navigate} verifyingFundCode={verifyingFundCode} />;
      case 'apply':
        return <ApplyPage navigate={navigate} onSubmit={handleApplicationSubmit} userProfile={currentUser} applicationDraft={applicationDraft} mainRef={mainRef} />;
      case 'profile':
        return <ProfilePage 
                    navigate={navigate} 
                    applications={userApplications} 
                    userProfile={currentUser} 
                    onProfileUpdate={handleProfileUpdate}
                    identities={userIdentities}
                    activeIdentity={activeIdentity}
                    onSetActiveIdentity={handleSetActiveIdentity}
                    onAddIdentity={handleStartAddIdentity}
                    onRemoveIdentity={handleRemoveIdentity}
                />;
      case 'support':
        return <SupportPage navigate={navigate} openChatbot={() => setIsChatbotOpen(true)} />;
       case 'tokenUsage':
        return <TokenUsagePage navigate={navigate} currentUser={currentUser} />;
      case 'submissionSuccess':
        if (!lastSubmittedApp) return <HomePage navigate={navigate} isApplyEnabled={isApplyEnabled} fundName={currentUser.fundName} userRole={currentUser.role} />;
        return <SubmissionSuccessPage application={lastSubmittedApp} onGoToProfile={() => setPage('profile')} />;
      case 'faq':
        return <FAQPage navigate={navigate} />;
      case 'paymentOptions':
        return <PaymentOptionsPage navigate={navigate} />;
      case 'donate':
        return <DonatePage navigate={navigate} />;
      case 'eligibility':
        return <EligibilityPage navigate={navigate} user={currentUser} />;
      case 'fundPortal':
        return <FundPortalPage navigate={navigate} user={currentUser} />;
      case 'dashboard':
        return <DashboardPage navigate={navigate} />;
      case 'ticketing':
        return <TicketingPage navigate={navigate} />;
      case 'programDetails':
        return <ProgramDetailsPage navigate={navigate} user={currentUser} />;
      case 'proxy':
        return <ProxyApplyPage 
                    navigate={navigate}
                    onSubmit={handleProxyApplicationSubmit}
                    proxyApplications={proxyApplications}
                />;
      case 'home':
      default:
        return <HomePage navigate={navigate} isApplyEnabled={isApplyEnabled} fundName={currentUser.fundName} userRole={currentUser.role} />;
    }
  };

  return (
    <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col">
      {currentUser && (
        <header className="bg-[#004b8d]/80 backdrop-blur-sm p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 shadow-md sticky top-0 z-30 border-b border-[#002a50]">
          <div className="justify-self-start">
            <button onClick={() => navigate('home')} className="flex items-center transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
              <img
                src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
                alt="E4E Relief Logo"
                className="h-10 w-auto"
              />
            </button>
          </div>
          <div className="text-center">
            <span className="text-gray-200 truncate">Welcome, {currentUser.firstName}</span>
          </div>
          <div className="justify-self-end">
            <button onClick={handleLogout} className="bg-[#ff8400]/80 hover:bg-[#ff8400] text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
              Logout
            </button>
          </div>
        </header>
      )}

      <main ref={mainRef} className={`flex-1 flex flex-col overflow-y-auto ${!currentUser ? 'items-center' : ''}`}>
        {renderPage()}
      </main>

      {currentUser && currentUser.role === 'User' && page !== 'classVerification' && <ChatbotWidget applications={userApplications} onChatbotAction={handleChatbotAction} isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} scrollContainerRef={mainRef} />}
    </div>
  );
}

export default App;