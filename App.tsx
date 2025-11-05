import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { UserProfile, Application, EventData, EligibilityDecision, ClassVerificationStatus, IdentityEligibility, EligibilityStatus, FundIdentity, ActiveIdentity } from './types';
import { evaluateApplicationEligibility, getAIAssistedDecision } from './services/geminiService';
// FIX: Corrected the import path for ApplicationFormData. It should be imported from './types' instead of a component file.
import type { ApplicationFormData } from './types';
import { init as initTokenTracker, reset as resetTokenTracker } from './services/tokenTracker';
import { getFundByCode } from './data/fundData';
import ClassVerificationPage from './components/ClassVerificationPage';

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


type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'dashboard' | 'ticketing' | 'programDetails' | 'proxy';

// --- MOCK DATABASE ---
const initialUsers: Record<string, UserProfile & { passwordHash: string }> = {
  'user@example.com': {
    // Identity
    identityId: 'user@example.com',
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
    eligibilityType: 'Active Full Time',
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
    fundCode: 'E4E',
    fundName: 'E4E Relief',
    classVerificationStatus: 'passed',
    eligibilityStatus: 'Eligible',
    role: 'User',
  },
  'admin@example.com': {
    identityId: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    mobileNumber: '555-987-6543',
    primaryAddress: {
      country: 'United States',
      street1: '456 Admin Ave',
      city: 'Corpville',
      state: 'NY',
      zip: '54321',
    },
    employmentStartDate: '2018-01-01',
    eligibilityType: 'Active Full Time',
    householdIncome: 120000,
    householdSize: 2,
    homeowner: 'Yes',
    preferredLanguage: 'English',
    isMailingAddressSame: true,
    ackPolicies: true,
    commConsent: true,
    infoCorrect: true,
    passwordHash: 'admin123',
    fundCode: 'ADMIN',
    fundName: 'Admin Relief Fund',
    classVerificationStatus: 'passed',
    eligibilityStatus: 'Eligible',
    role: 'Admin',
  },
};

const initialIdentitiesData: FundIdentity[] = [
    {
        id: 'user@example.com-E4E',
        userEmail: 'user@example.com',
        fundCode: 'E4E',
        fundName: 'E4E Relief',
        cvType: 'Domain',
        eligibilityStatus: 'Eligible',
        classVerificationStatus: 'passed',
        createdAt: '2023-01-01T12:00:00Z',
        lastUsedAt: new Date().toISOString(),
    },
    {
        id: 'user@example.com-JHH',
        userEmail: 'user@example.com',
        fundCode: 'JHH',
        fundName: 'JHH Relief',
        cvType: 'Roster',
        eligibilityStatus: 'Not Eligible',
        classVerificationStatus: 'pending',
        createdAt: '2024-05-10T10:00:00Z',
    },
    {
        id: 'admin@example.com-ADMIN',
        userEmail: 'admin@example.com',
        fundCode: 'ADMIN',
        fundName: 'Admin Relief Fund',
        cvType: 'Domain',
        eligibilityStatus: 'Eligible',
        classVerificationStatus: 'passed',
        createdAt: '2022-01-01T12:00:00Z',
        lastUsedAt: new Date().toISOString(),
    }
];


const initialApplications: Record<string, Application[]> = {
  'user@example.com': [
    {
      id: 'APP-1001',
      profileSnapshot: initialUsers['user@example.com'], // Snapshot of the user profile
      event: 'Flood',
      eventDate: '2023-08-10',
      requestedAmount: 2500,
      // FIX: Add missing 'expenses' property to satisfy the Application type.
      expenses: [],
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
      submittedBy: 'user@example.com',
    },
     {
      id: 'APP-1002',
      profileSnapshot: { ...initialUsers['user@example.com'], fundCode: 'JHH', fundName: 'JHH Relief' },
      event: 'Crime',
      eventDate: '2024-03-20',
      requestedAmount: 1000,
      expenses: [],
      evacuated: 'No',
      powerLoss: 'No',
      submittedDate: '2024-03-22',
      status: 'Declined',
      reasons: ["Requested amount exceeds the remaining 12-month limit of $500.00."],
      decisionedDate: '2024-03-22',
      twelveMonthGrantRemaining: 500,
      lifetimeGrantRemaining: 24000,
      shareStory: false,
      receiveAdditionalInfo: true,
      submittedBy: 'user@example.com',
    },
  ],
};

const initialProxyApplications: Application[] = [
    {
      id: 'PROXY-001',
      profileSnapshot: initialUsers['user@example.com'],
      event: 'Wildfire',
      eventDate: '2024-06-15',
      requestedAmount: 1500,
      expenses: [],
      evacuated: 'Yes',
      powerLoss: 'No',
      submittedDate: '2024-06-18',
      status: 'Submitted',
      reasons: ["Application is under review."],
      decisionedDate: '2024-06-18',
      twelveMonthGrantRemaining: 7500,
      lifetimeGrantRemaining: 47500,
      shareStory: false,
      receiveAdditionalInfo: true,
      submittedBy: 'admin@example.com',
    }
];

const createNewUserProfile = (
    firstName: string,
    lastName: string,
    email: string,
    fundCode: string,
): UserProfile => {
    const fund = getFundByCode(fundCode);
    return {
        identityId: email,
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
        fundCode,
        fundName: fund?.name || 'Relief Fund',
        classVerificationStatus: 'pending',
        eligibilityStatus: 'Not Eligible',
        role: 'User',
    };
};


// --- END MOCK DATABASE ---

function App() {
  const [page, setPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [applications, setApplications] = useState(initialApplications);
  const [proxyApplications, setProxyApplications] = useState(initialProxyApplications);
  
  const [allIdentities, setAllIdentities] = useState<FundIdentity[]>(initialIdentitiesData);
  const [activeIdentity, setActiveIdentity] = useState<ActiveIdentity | null>(null);
  const [verifyingFundCode, setVerifyingFundCode] = useState<string | null>(null);

  const [lastSubmittedApp, setLastSubmittedApp] = useState<Application | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<Partial<ApplicationFormData> | null>(null);
  const [autofillTrigger, setAutofillTrigger] = useState(0);
  const [adminAutofillTrigger, setAdminAutofillTrigger] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const userIdentities = useMemo(() => {
    if (!currentUser) return [];
    return allIdentities.filter(id => id.userEmail === currentUser.email);
  }, [currentUser, allIdentities]);

  const userApplications = useMemo(() => {
    if (currentUser && activeIdentity) {
      return applications[currentUser.email]?.filter(app => app.profileSnapshot.fundCode === activeIdentity.fundCode) || [];
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

  const handleSetActiveIdentity = useCallback((identityId: string) => {
    if (!currentUser) return;

    const identityToActivate = allIdentities.find(i => i.id === identityId);
    if (identityToActivate && identityToActivate.eligibilityStatus === 'Eligible') {
        console.log(`[Telemetry] track('IdentitySwitch', { from: ${activeIdentity?.fundCode}, to: ${identityToActivate.fundCode} })`);
        
        setActiveIdentity({ id: identityToActivate.id, fundCode: identityToActivate.fundCode });

        // Update current user composite object
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                fundCode: identityToActivate.fundCode,
                fundName: identityToActivate.fundName,
                classVerificationStatus: identityToActivate.classVerificationStatus,
                eligibilityStatus: identityToActivate.eligibilityStatus,
            };
        });

        // Update last used timestamp
        setAllIdentities(prev => prev.map(id => id.id === identityId ? { ...id, lastUsedAt: new Date().toISOString() } : id));
    }
  }, [currentUser, allIdentities, activeIdentity]);

  const handleLogin = useCallback((email: string, password: string): boolean => {
    const user = users[email];
    if (user && user.passwordHash === password) {
      const { passwordHash, ...profile } = user;
      
      const userIdentities = allIdentities.filter(id => id.userEmail === email);
      const lastUsedIdentity = userIdentities.sort((a,b) => new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime())[0];
      
      let identityToActivate = lastUsedIdentity;
      // If last used is inactive, find the first active one
      if (lastUsedIdentity && lastUsedIdentity.eligibilityStatus !== 'Eligible') {
          identityToActivate = userIdentities.find(id => id.eligibilityStatus === 'Eligible') || lastUsedIdentity;
      }
      
      if (identityToActivate) {
          const hydratedProfile: UserProfile = {
            ...profile,
            fundCode: identityToActivate.fundCode,
            fundName: identityToActivate.fundName,
            classVerificationStatus: identityToActivate.classVerificationStatus,
            eligibilityStatus: identityToActivate.eligibilityStatus,
          };
          setCurrentUser(hydratedProfile);
          setActiveIdentity({ id: identityToActivate.id, fundCode: identityToActivate.fundCode });
          initTokenTracker(hydratedProfile);

          if (hydratedProfile.classVerificationStatus !== 'passed' || hydratedProfile.eligibilityStatus !== 'Eligible') {
            setPage('classVerification');
          } else {
            setPage('home');
          }
      } else {
          // No identities found, treat as fresh registration
          setCurrentUser(profile);
          initTokenTracker(profile);
          setPage('classVerification');
      }
      
      return true;
    }
    return false;
  }, [users, allIdentities]);
  
  const handleRegister = useCallback((firstName: string, lastName: string, email: string, password: string, fundCode: string): boolean => {
    if (users[email]) {
      return false; // User already exists
    }
    const newUserProfile = createNewUserProfile(firstName, lastName, email, fundCode);
    const newUser = {
      ...newUserProfile,
      passwordHash: password,
    };
    setUsers(prev => ({ ...prev, [email]: newUser }));
    setApplications(prev => ({ ...prev, [email]: [] }));
    
    setCurrentUser(newUserProfile);
    initTokenTracker(newUserProfile);
    setVerifyingFundCode(fundCode); // Set context for verification
    setPage('classVerification');
    return true;
  }, [users]);
  
  const handleStartAddIdentity = useCallback((fundCode: string) => {
    if (!currentUser) return;
    
    const identity = allIdentities.find(id => id.userEmail === currentUser.email && id.fundCode === fundCode);
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

  const handleRemoveIdentity = useCallback((identityId: string) => {
    if (!currentUser) return;
    const identityToRemove = allIdentities.find(id => id.id === identityId);
    if (!identityToRemove) return;

    if (activeIdentity?.id === identityId) {
        alert("You cannot remove your active identity.");
        return;
    }

    if (window.confirm(`Are you sure you want to remove the identity for ${identityToRemove.fundName}?`)) {
        console.log(`[Telemetry] track('IdentityRemove', { fundCode: ${identityToRemove.fundCode} })`);
        setAllIdentities(prev => prev.filter(id => id.id !== identityId));
    }
  }, [currentUser, allIdentities, activeIdentity]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveIdentity(null);
    setVerifyingFundCode(null);
    resetTokenTracker();
    setPage('login');
  };
  
  const navigate = useCallback((targetPage: Page) => {
    if (targetPage === 'apply' && !isApplyEnabled) {
        console.log("Gating 'apply' page. User not verified or not eligible.");
        setPage('classVerification');
    } else {
        setPage(targetPage);
    }
  }, [isApplyEnabled]);

  const handleVerificationSuccess = useCallback(() => {
    if (!currentUser) return;

    const userExistingIdentities = allIdentities.filter(id => id.userEmail === currentUser.email);
    const isInitialRegistration = userExistingIdentities.length === 0;

    // This is the fund code that was just verified, either a new one or the user's initial one.
    const fundCodeToVerify = verifyingFundCode || currentUser.fundCode;
    const fund = getFundByCode(fundCodeToVerify);
    
    if (!fund) {
        console.error("Verification successful but could not find fund config for", fundCodeToVerify);
        setVerifyingFundCode(null);
        setPage('profile'); // or home
        return;
    }
    
    const identityIdToUpdate = `${currentUser.email}-${fund.code}`;
    const existingIdentity = userExistingIdentities.find(id => id.id === identityIdToUpdate);

    if (existingIdentity) { // UPDATE existing identity (re-verification)
        console.log(`[Telemetry] track('IdentityReverified', { fundCode: ${fund.code} })`);
        setAllIdentities(prev => prev.map(id => 
            id.id === identityIdToUpdate 
            ? { ...id, eligibilityStatus: 'Eligible', classVerificationStatus: 'passed' } 
            : id
        ));
        // If we just re-verified, let's make it active.
        handleSetActiveIdentity(identityIdToUpdate);
    } else { // ADD new identity
        console.log(`[Telemetry] track('IdentityCreated', { fundCode: ${fund.code}, cvType: ${fund.cvType} })`);
        const newIdentity: FundIdentity = {
            id: identityIdToUpdate,
            userEmail: currentUser.email,
            fundCode: fund.code,
            fundName: fund.name,
            cvType: fund.cvType,
            eligibilityStatus: 'Eligible',
            classVerificationStatus: 'passed',
            createdAt: new Date().toISOString(),
        };
        setAllIdentities(prev => [...prev, newIdentity]);
        // Automatically make the new identity active
        handleSetActiveIdentity(newIdentity.id);
    }

    setVerifyingFundCode(null);

    if (isInitialRegistration) {
        // We also need to fully hydrate the currentUser object for the first time
        const updatedProfile: UserProfile = {
            ...currentUser,
            classVerificationStatus: 'passed',
            eligibilityStatus: 'Eligible',
            fundCode: fund.code, // Set the fund code from the newly verified identity
            fundName: fund.name,
        };
        setCurrentUser(updatedProfile);
        setPage('home');
    } else {
        setPage('profile');
    }
  }, [currentUser, verifyingFundCode, allIdentities, handleSetActiveIdentity]);
  
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
    
    const fund = getFundByCode(currentUser.fundCode);
    const initialTwelveMonthMax = fund?.limits?.twelveMonthMax ?? 10000;
    const initialLifetimeMax = fund?.limits?.lifetimeMax ?? 50000;
    const singleRequestMax = fund?.limits?.singleRequestMax ?? 10000;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;

    // Step 1: Call the local rules engine to get a preliminary decision
    const preliminaryDecision = evaluateApplicationEligibility({
        id: tempId,
        employmentStartDate: appFormData.profileData.employmentStartDate,
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining: currentTwelveMonthRemaining,
        currentLifetimeRemaining: currentLifetimeRemaining,
        singleRequestMax: singleRequestMax,
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
      submittedBy: currentUser.email,
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
  
  const handleProxyApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser || currentUser.role !== 'Admin') {
        console.error("Only admins can submit proxy applications.");
        return;
    };

    const applicantEmail = appFormData.profileData.email?.toLowerCase();
    if (!applicantEmail) {
        alert("Applicant email is required to submit a proxy application.");
        return;
    }

    const tempId = `PROXY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const applicantInDb = users[applicantEmail];
    const usersPastApplications = applicantInDb ? (applications[applicantEmail] || []) : [];

    if (!applicantInDb) {
        const newPasswordHash = 'password123'; // Default password
        // FIX: The appFormData.profileData (UserProfile) does not contain a passwordHash.
        // Create a new user object by spreading the profile data and adding the hash.
        const newProfile: UserProfile & { passwordHash: string } = {
            ...appFormData.profileData,
            passwordHash: newPasswordHash,
            role: 'User'
        };
        setUsers(prev => ({ ...prev, [applicantEmail]: newProfile }));
        setApplications(prev => ({ ...prev, [applicantEmail]: [] }));
    }

    const lastApplication = usersPastApplications.length > 0 ? usersPastApplications[usersPastApplications.length - 1] : null;
    
    const applicantFundCode = appFormData.profileData.fundCode;
    const fund = getFundByCode(applicantFundCode);
    const initialTwelveMonthMax = fund?.limits?.twelveMonthMax ?? 10000;
    const initialLifetimeMax = fund?.limits?.lifetimeMax ?? 50000;
    const singleRequestMax = fund?.limits?.singleRequestMax ?? 10000;

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialTwelveMonthMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: tempId,
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
      submittedDate: new Date().toLocaleDateString('en-CA'),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.email,
    };
    
    setProxyApplications(prev => [...prev, newApplication]);
    
    setApplications(prev => ({
      ...prev,
      [applicantEmail]: [...(prev[applicantEmail] || []), newApplication],
    }));
    
    // FIX: The appFormData.profileData (UserProfile) does not contain a passwordHash.
    // To compare if the profile was updated, we must remove the passwordHash from the existing
    // user record in the database (`applicantInDb`) before comparing it with the form data.
    if (applicantInDb) {
        const { passwordHash, ...dbProfileData } = applicantInDb;
        if (JSON.stringify(appFormData.profileData) !== JSON.stringify(dbProfileData)) {
            setUsers(prev => ({
                ...prev,
                [applicantEmail]: {
                    ...prev[applicantEmail],
                    ...appFormData.profileData
                }
            }));
        }
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');
  }, [currentUser, applications, users]);

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
          <div className="w-full flex justify-center items-center py-12">
            <img 
              src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi" 
              alt="E4E Relief Logo" 
              className="mx-auto h-32 w-auto cursor-pointer"
              onClick={() => {
                if (page === 'register') {
                  setAutofillTrigger(c => c + 1);
                } else {
                  setAdminAutofillTrigger(c => c + 1);
                }
              }}
            />
          </div>
          
          <div className="w-full max-w-md px-4 pb-8">
            {page === 'register' ? (
              <RegisterPage onRegister={handleRegister} switchToLogin={() => setPage('login')} autofillTrigger={autofillTrigger} />
            ) : (
              <LoginPage onLogin={handleLogin} switchToRegister={() => setPage('register')} adminAutofillTrigger={adminAutofillTrigger} />
            )}
          </div>
        </>
      );
    }
    
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
        <header className="bg-[#004b8d]/80 backdrop-blur-sm p-4 grid grid-cols-3 items-center shadow-md sticky top-0 z-30 border-b border-[#002a50]">
          <div className="justify-self-start">
            <button onClick={() => navigate('home')} className="flex items-center transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#003a70] focus:ring-[#ff8400] rounded-md p-1" aria-label="Go to Home page">
              <img
                src="https://gateway.pinata.cloud/ipfs/bafybeihjhfybcxtlj6r4u7c6jdgte7ehcrctaispvtsndkvgc3bmevuvqi"
                alt="E4E Relief Logo"
                className="h-10 w-auto"
              />
            </button>
          </div>
          <div className="justify-self-center text-center flex items-center">
             {activeIdentity && (
              <span className="bg-[#ff8400]/80 text-white text-xs font-bold mr-3 px-2.5 py-1 rounded-full">{activeIdentity.fundCode}</span>
            )}
            <span className="text-gray-200">Welcome, {currentUser.firstName}</span>
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