// --- Base Data Structures ---
import type { Fund } from './data/fundData';

/**
 * Represents a standard physical address.
 * Used for both primary and mailing addresses in the UserProfile.
 */
export interface Address {
  country: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Defines the possible states of an applicant's class verification process for a specific fund.
 * - 'unknown': The initial state before any verification has been attempted.
 * - 'pending': The verification process has been initiated but is not yet complete.
 * - 'passed': The user has successfully been verified for the fund.
 * - 'failed': The user failed the verification process.
 */
export type ClassVerificationStatus = 'unknown' | 'pending' | 'passed' | 'failed';

/**
 * Defines the user's eligibility status to apply for a grant from a specific fund.
 * This is typically determined after a successful class verification.
 */
export type EligibilityStatus = 'Eligible' | 'Not Eligible';

/**
 * Represents the eligibility status for a specific user identity.
 * (Currently not in active use, but available for more granular eligibility tracking).
 */
export interface IdentityEligibility {
  identityId: string;
  status: EligibilityStatus;
  updatedAt: string;
}

/**
 * A unique identifier for a FundIdentity, typically a composite of user email and fund code.
 */
export type FundIdentityId = string;

/**
 * Represents a user's relationship with a specific relief fund.
 * A single user (identified by `uid`) can have multiple identities if they are
 * eligible for more than one fund.
 */
export interface FundIdentity {
  id: FundIdentityId;
  uid: string;
  fundCode: string;
  fundName: string;
  cvType: 'Domain' | 'Roster' | 'SSO' | 'Manual'; // The method used for class verification.
  eligibilityStatus: EligibilityStatus;
  classVerificationStatus: ClassVerificationStatus;
  createdAt: string;
  lastUsedAt?: string; // Tracks the last time this identity was the active one.
}
/**
 * A lightweight object representing the currently active fund identity for the logged-in user.
 * This determines which fund's applications and data are displayed.
 */
export interface ActiveIdentity {
  id: FundIdentityId;
  fundCode: string;
}

// FIX: Add a centralized Page type for navigation.
export type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'ticketing' | 'programDetails' | 'proxy' | 'liveDashboard' | 'myApplications' | 'myProxyApplications' | 'forgotPassword';


/**
 * The main data model for a user's profile information.
 * This is a composite object that also reflects the state of their currently active FundIdentity
 * (e.g., fundCode, fundName, eligibilityStatus).
 */
export interface UserProfile {
  uid: string;
  identityId: string; // Corresponds to the user's primary identifier, usually their email.
  // FIX: Added 'activeIdentityId' to track the user's currently selected fund identity.
  activeIdentityId: string | null;
  firstName: string;
  lastName:string;
  middleName?: string;
  suffix?: string;
  email: string;
  mobileNumber: string;
  primaryAddress: Address;
  mailingAddress?: Address;
  employmentStartDate: string;
  eligibilityType: string;
  householdIncome: number | '';
  householdSize: number | '';
  homeowner: 'Yes' | 'No' | '';
  preferredLanguage?: string;
  isMailingAddressSame: boolean | null;
  ackPolicies: boolean;
  commConsent: boolean;
  infoCorrect: boolean;
  fundCode: string; // The fund code of the *active* identity.
  fundName?: string; // The fund name of the *active* identity.
  classVerificationStatus: ClassVerificationStatus; // Status for the *active* identity.
  eligibilityStatus: EligibilityStatus; // Status for the *active* identity.
  role: 'User' | 'Admin';
  tokensUsedTotal?: number;
  estimatedCostTotal?: number;
}

/**
 * Represents a single expense item within a relief application.
 */
export interface Expense {
  id: string; // A unique identifier for the expense item.
  type: 'Basic Disaster Supplies' | 'Food Spoilage' | 'Meals' | '';
  amount: number | '';
  fileName: string; // Name of the uploaded receipt file, if any.
  fileUrl?: string; // URL to the uploaded file in Firebase Storage.
}

/**
 * Contains all data related to the specific event for which a user is applying for relief.
 */
export interface EventData {
  event: string; // The primary type of event (e.g., 'Flood', 'Wildfire').
  eventName?: string; // The specific name of the event, e.g., "Hurricane Ian"
  otherEvent?: string; // Details if 'My disaster is not listed' is selected.
  eventDate: string;
  evacuated: 'Yes' | 'No' | '';
  evacuatingFromPrimary?: 'Yes' | 'No' | '';
  evacuationReason?: string;
  stayedWithFamilyOrFriend?: 'Yes' | 'No' | '';
  evacuationStartDate?: string;
  evacuationNights?: number | '';
  powerLoss: 'Yes' | 'No' | '';
  powerLossDays?: number | '';
  additionalDetails?: string;
  requestedAmount: number;
  expenses: Expense[];
}

/**
 * A composite object representing the complete state of an application form during the submission process.
 * This structure is passed between the different steps of the application flow.
 */
export interface ApplicationFormData {
  profileData: UserProfile;
  eventData: EventData;
  agreementData: {
    shareStory: boolean | null;
    receiveAdditionalInfo: boolean | null;
  };
}

/**
 * Represents a submitted application record, including the decision and resulting grant balances.
 * This interface extends EventData with metadata about the submission and decision.
 */
export interface Application extends EventData {
  id: string;
  uid: string;
  profileSnapshot: UserProfile; // A snapshot of the user's profile at the time of submission.
  submittedDate: string;
  status: 'Submitted' | 'Awarded' | 'Declined';
  reasons: string[]; // Justification for the decision, can be from the rules engine or AI.
  decisionedDate: string;
  twelveMonthGrantRemaining: number;
  lifetimeGrantRemaining: number;
  shareStory: boolean;
  receiveAdditionalInfo: boolean;
  submittedBy: string; // UID of the user who submitted (can be applicant or admin proxy).
  isProxy: boolean;
}

/**
 * Represents the output of the eligibility decision engine (local or AI-assisted).
 * This provides a structured breakdown of the decision-making process for auditing and review.
 */
export interface EligibilityDecision {
  decision: 'Approved' | 'Denied' | 'Review';
  reasons: string[];
  policy_hits: { rule_id: string; passed: boolean; detail: string; }[];
  recommended_award: number;
  remaining_12mo: number;
  remaining_lifetime: number;
  normalized: {
    event: string;
    eventDate: string;
    evacuated: string;
    powerLossDays: number;
  };
  decisionedDate: string;
}

// --- Chat-related Types ---

/**
 * Defines the sender of a message in the chat interface.
 */
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error',
}

/**
 * Represents a single message within a chat conversation.
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// --- Token Usage Analytics Types ---

/**
 * Defines the cost per 1000 tokens for input and output for a given Gemini model.
 */
export interface ModelPricing {
  [key: string]: {
    input: number; // Price per 1000 tokens
    output: number;
  };
}

/**
 * Represents a single logged event of a Gemini API call.
 * This is the raw data used for generating analytics.
 */
export interface TokenEvent {
  id: string;
  sessionId: string;
  uid: string;
  userId: string;
  timestamp: string;
  feature: 'AI Assistant' | 'Address Parsing' | 'Application Parsing' | 'Final Decision';
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  environment: 'Production' | 'Development';
  account: string;
  fundCode: string;
}

// FIX: Added missing type definitions for Token Usage Analytics.
/**
 * Represents a single row in the token usage table, aggregated by user, session, and feature.
 */
export interface TokenUsageTableRow {
  user: string;
  session: string;
  feature: string;
  input: number;
  cached: number;
  output: number;
  total: number;
  cost: number;
}

/**
 * Defines the structure for the filters used on the token usage analytics page.
 */
export interface TokenUsageFilters {
  account: string;
  dateRange: {
    start: string;
    end: string;
  };
  feature: string;
  user: string;
  model: string;
  environment: string;
}

/**
 * Represents aggregated token usage data for the session with the highest token count.
 */
export interface TopSessionData {
  sessionId: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Represents aggregated daily token usage for a specific feature (like AI Assistant).
 */
export interface DailyUsageData {
  date: string;
  totalTokens: number;
}

/**
 * Represents a single data point for real-time charts, like usage over the last hour.
 */
export interface LastHourUsageDataPoint {
  timestamp: string;
  totalTokens: number;
}