import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { User, IdTokenResult } from 'firebase/auth';
// FIX: Import the centralized Page type and alias it to avoid naming conflicts.
import type { UserProfile, Application, EventData, EligibilityDecision, ClassVerificationStatus, EligibilityStatus, FundIdentity, ActiveIdentity, Page as GlobalPage } from './types';
import type { Fund } from './data/fundData';
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
import SideNavBar from './components/SideNavBar';
import BottomNavBar from './components/BottomNavBar';
import { IconDefs } from './components/Icons';
import Footer from './components/Footer';
import Header from './components/Header';
import LiveDashboardPage from './components/LiveDashboardPage';
import MyApplicationsPage from './components/MyApplicationsPage';
import MyProxyApplicationsPage from './components/MyProxyApplicationsPage';

// FIX: Removed local Page type definition.
// type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

type AuthState = {
    status: 'loading' | 'signedIn' | 'signedOut';
    user: User | null;
    profile: UserProfile | null;
    claims: { admin?: boolean };
};

function App() {
  const [page, setPage] = useState<GlobalPage>('login');
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading', user: null, profile: null, claims: {} });
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [proxyApplications, setProxyApplications] = useState<Application[]>([]);
  const [allIdentities, setAllIdentities] = useState<FundIdentity[]>([]);
  const [activeIdentity, setActiveIdentity] = useState<ActiveIdentity | null>(null);
  const [activeFund, setActiveFund] = useState<Fund | null>(null);
  
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

            // Synchronize the profile's role with the auth token's custom claim.
            // The custom claim is the source of truth for authorization.
            if (claims.admin === true) {
                hydratedProfile.role = 'Admin';
            } else {
                hydratedProfile.role = 'User';
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

  useEffect(() => {
    const fetchActiveFund = async () => {
      if (activeIdentity) {
        const fundData = await fundsRepo.getFund(activeIdentity.fundCode);
        if (fundData) {
          setActiveFund(fundData);
        } else {
          console.error(`Could not load fund configuration for ${activeIdentity.fundCode}`);
          setActiveFund(null);
        }
      }
    };
    fetchActiveFund();
  }, [activeIdentity]);

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
  
  const userProxyApplications = useMemo(() => {
    if (currentUser?.role === 'Admin' && activeIdentity) {
      return proxyApplications.filter(app => app.profileSnapshot.fundCode === activeIdentity.fundCode) || [];
    }
    return [];
  }, [currentUser, proxyApplications, activeIdentity]);

  const isVerifiedAndEligible = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.classVerificationStatus === 'passed' && currentUser.eligibilityStatus === 'Eligible';
  }, [currentUser]);

  const { twelveMonthRemaining, lifetimeRemaining } = useMemo(() => {
      const latestApp = userApplications.length > 0 ? userApplications[userApplications.length - 1] : null;
      
      const initialTwelveMonthMax = activeFund?.limits?.twelveMonthMax ?? 0;
      const initialLifetimeMax = activeFund?.limits?.lifetimeMax ?? 0;

      return {
          twelveMonthRemaining: latestApp ? latestApp.twelveMonthGrantRemaining : initialTwelveMonthMax,
          lifetimeRemaining: latestApp ? latestApp.lifetimeGrantRemaining : initialLifetimeMax,
      };
  }, [userApplications, activeFund]);

  const canApply = isVerifiedAndEligible && twelveMonthRemaining > 0 && lifetimeRemaining > 0;

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
  
  const navigate = useCallback((targetPage: GlobalPage) => {
    if (targetPage === 'apply' && !isVerifiedAndEligible) {
        console.log("Gating 'apply' page. User not verified or not eligible.");
        setPage('classVerification');
    } else {
        setPage(targetPage);
    }
  }, [isVerifiedAndEligible]);

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
    if (!currentUser || !activeFund) {
        alert("Could not load fund configuration. Please try again later.");
        return;
    }
    
    const usersPastApplications = userApplications || [];
    const lastApplication = usersPastApplications.length > 0 ? usersPastApplications.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0] : null;
    
    const { twelveMonthMax: initialTwelveMonthMax, lifetimeMax: initialLifetimeMax, singleRequestMax } = activeFund.limits;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    const allEligibleEvents = [...(activeFund.eligibleDisasters || []), ...(activeFund.eligibleHardships || [])];
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp',
        employmentStartDate: appFormData.profileData.employmentStartDate,
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining,
        currentLifetimeRemaining,
        singleRequestMax,
        eligibleEvents: allEligibleEvents,
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
      submittedDate: new Date().toISOString(),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
      isProxy: false,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);

    try {
        const draftKey = `applicationDraft-${currentUser.uid}-${currentUser.fundCode}`;
        localStorage.removeItem(draftKey);
        console.log("Successfully submitted. Cleared saved application draft.");
    } catch (error) {
        console.error("Could not remove application draft from localStorage after submission:", error);
    }
    
    setApplications(prev => [...prev, newApplication]);
    
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(currentUser)) {
        await handleProfileUpdate(appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');

  }, [currentUser, handleProfileUpdate, userApplications, activeFund]);
  
  const handleProxyApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser || authState.claims.admin !== true || !activeFund) {
        console.error("Only admins with an active fund can submit proxy applications.");
        return;
    };

    // Use the admin's active fund for the application, not one from the form.
    appFormData.profileData.fundCode = activeFund.code;
    appFormData.profileData.fundName = activeFund.name;

    const applicantEmail = appFormData.profileData.email?.toLowerCase();
    if (!applicantEmail) {
        alert("Applicant email is required to submit a proxy application.");
        return;
    }

    // Proxy submissions are only allowed for existing users to prevent auth state issues.
    let applicantProfile = await usersRepo.getByEmail(applicantEmail);

    if (!applicantProfile) {
        alert("Applicant not found. Please ensure the user has an existing account before submitting a proxy application.");
        return;
    }
    
    // Merge any updated form data into the existing applicant profile before snapshotting.
    const updatedApplicantProfile = { ...applicantProfile, ...appFormData.profileData };
    appFormData.profileData = updatedApplicantProfile;

    const allApplicantApps = await applicationsRepo.getForUser(applicantProfile.uid);
    const applicantPastApps = allApplicantApps.filter(app => app.profileSnapshot.fundCode === activeFund.code);
    const lastApplication = applicantPastApps.length > 0 ? applicantPastApps.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0] : null;
    
    const fund = activeFund;
    const { twelveMonthMax: initialTwelveMonthMax, lifetimeMax: initialLifetimeMax, singleRequestMax } = fund.limits;
    const allEligibleEvents = [...(fund.eligibleDisasters || []), ...(fund.eligibleHardships || [])];

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialLifetimeMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp', employmentStartDate: appFormData.profileData.employmentStartDate, eventData: appFormData.eventData,
        currentTwelveMonthRemaining, currentLifetimeRemaining, singleRequestMax, eligibleEvents: allEligibleEvents,
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
      submittedDate: new Date().toISOString(),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
      isProxy: true,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);

    try {
        const draftKey = `applicationDraft-${applicantProfile.uid}-${appFormData.profileData.fundCode}`;
        localStorage.removeItem(draftKey);
        console.log(`Proxy submission successful. Cleared saved draft for user ${applicantProfile.email}.`);
    } catch (error) {
        console.error("Could not remove proxy application draft from localStorage after submission:", error);
    }

    setProxyApplications(prev => [...prev, newApplication]);
    
    // Update profile if changed
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(applicantProfile)) {
        await usersRepo.update(applicantProfile.uid, appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');
  }, [currentUser, authState.claims.admin, activeFund]);

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
  
  const pagesWithoutFooter: GlobalPage[] = ['home', 'login', 'register', 'classVerification'];

  const renderPage = () => {
    if (authState.status === 'loading' || (authState.status === 'signedIn' && !currentUser)) {
      return <LoadingOverlay message="Authenticating..." />;
    }
    
    if (authState.status === 'signedOut') {
      return (
        <div className="flex-1 flex justify-center p-4">
            <div className="w-full max-w-lg px-4 pt-8 sm:pt-12">
                {page === 'register' ? (
                <RegisterPage onRegister={authClient.register} switchToLogin={() => setPage('login')} />
                ) : (
                <LoginPage onLogin={authClient.signIn} switchToRegister={() => setPage('register')} />
                )}
            </div>
        </div>
      );
    }
    
    // This case should now be covered by the loading overlay above, but as a fallback:
    if (!currentUser) return <LoadingOverlay message="Loading Profile..." />;

    switch (page) {
      case 'classVerification':
        return <ClassVerificationPage user={currentUser} onVerificationSuccess={handleVerificationSuccess} navigate={navigate} verifyingFundCode={verifyingFundCode} />;
      case 'apply':
        return <ApplyPage navigate={navigate} onSubmit={handleApplicationSubmit} userProfile={currentUser} applicationDraft={applicationDraft} mainRef={mainRef} canApply={canApply} />;
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
                    activeFund={activeFund}
                />;
      case 'myApplications':
        return <MyApplicationsPage 
                    navigate={navigate}
                    applications={userApplications}
                    userProfile={currentUser}
                    onAddIdentity={handleStartAddIdentity}
                />;
      case 'myProxyApplications':
        return <MyProxyApplicationsPage 
                    navigate={navigate}
                    applications={userProxyApplications}
                    userProfile={currentUser}
                />;
      case 'support':
        return <SupportPage navigate={navigate} openChatbot={() => setIsChatbotOpen(true)} />;
       case 'tokenUsage':
        return <TokenUsagePage navigate={navigate} currentUser={currentUser} />;
      case 'submissionSuccess':
        if (!lastSubmittedApp) return <HomePage navigate={navigate} isVerifiedAndEligible={isVerifiedAndEligible} canApply={canApply} fundName={currentUser.fundName} userRole={currentUser.role} />;
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
      case 'liveDashboard':
        return <LiveDashboardPage navigate={navigate} />;
      case 'ticketing':
        return <TicketingPage navigate={navigate} />;
      case 'programDetails':
        return <ProgramDetailsPage navigate={navigate} user={currentUser} />;
      case 'proxy':
        return <ProxyApplyPage 
                    navigate={navigate}
                    onSubmit={handleProxyApplicationSubmit}
                    proxyApplications={userProxyApplications}
                    userProfile={currentUser}
                    onAddIdentity={handleStartAddIdentity}
                    mainRef={mainRef}
                />;
      case 'home':
      default:
        return <HomePage navigate={navigate} isVerifiedAndEligible={isVerifiedAndEligible} canApply={canApply} fundName={currentUser.fundName} userRole={currentUser.role} />;
    }
  };
  
  // Logged out view is handled inside renderPage()
  if (!currentUser) {
      return (
          <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col">
              <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto">
                  {renderPage()}
              </main>
          </div>
      );
  }

  return (
    <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col md:flex-row overflow-hidden">
      <IconDefs />
      <SideNavBar 
        navigate={navigate}
        currentPage={page}
        userRole={currentUser.role}
        userName={currentUser.firstName}
        onLogout={handleLogout}
        canApply={canApply}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
            navigate={navigate}
            userName={currentUser.firstName}
            onLogout={handleLogout}
        />
        <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">
          <div className="hidden md:block">
            {page === 'profile' && (
               <div className="relative flex justify-center items-center my-8">
                  <div className="text-center">
                      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                        Profile
                      </h1>
                      {activeIdentity && (
                        <div className="mt-2 flex flex-col items-center gap-2">
                          <p className="text-lg text-gray-300">{currentUser.fundName} ({currentUser.fundCode})</p>
                           <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors bg-green-800/50 text-green-300">
                              Eligible to apply
                          </span>
                        </div>
                      )}
                  </div>
              </div>
            )}
          </div>
          {renderPage()}
          {!pagesWithoutFooter.includes(page) && <Footer />}
        </main>
        
        <BottomNavBar
            navigate={navigate}
            currentPage={page}
            userRole={currentUser.role}
            canApply={canApply}
        />
        
        {/* FIX: Pass setIsChatbotOpen to the setIsOpen prop. */}
        {page !== 'classVerification' && <ChatbotWidget applications={userApplications} onChatbotAction={handleChatbotAction} isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} scrollContainerRef={mainRef} activeFund={activeFund} />}
      </div>
    </div>
  );
}

export default App;
