// --- Base Data Structures ---

export interface Address {
  country: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface UserProfile {
  firstName: string;
  lastName:string;
  middleName?: string;
  suffix?: string;
  email: string;
  mobileNumber: string;
  primaryAddress: Address;
  mailingAddress?: Address;
  employmentStartDate: string;
  eligibilityType: 'Full-time' | 'Part-time' | 'Contractor' | '';
  householdIncome: number | '';
  householdSize: number | '';
  homeowner: 'Yes' | 'No' | '';
  preferredLanguage?: string;
  isMailingAddressSame: boolean | null;
  ackPolicies: boolean;
  commConsent: boolean;
  infoCorrect: boolean;
}

export interface EventData {
  event: 'Flood' | 'Tornado' | 'Tropical Storm/Hurricane' | 'Wildfire' | 'My disaster is not listed' | '';
  otherEvent?: string;
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
}

export interface ApplicationFormData {
  profileData: UserProfile;
  eventData: EventData;
  agreementData: {
    shareStory: boolean | null;
    receiveAdditionalInfo: boolean | null;
  };
}

export interface Application extends EventData {
  id: string;
  profileSnapshot: UserProfile;
  submittedDate: string;
  status: 'Submitted' | 'Awarded' | 'Declined';
  reasons: string[];
  decisionedDate: string;
  twelveMonthGrantRemaining: number;
  lifetimeGrantRemaining: number;
  shareStory: boolean;
  receiveAdditionalInfo: boolean;
}

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

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error',
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// --- Token Usage Analytics Types ---

export interface ModelPricing {
  [key: string]: {
    input: number; // Price per 1000 tokens
    output: number;
  };
}

export interface TokenEvent {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  feature: 'AI Assistant' | 'Address Parsing' | 'Application Parsing' | 'Final Decision';
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  environment: 'Production' | 'Development';
  account: string;
}

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

export interface TopSessionData {
  sessionId: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LastHourUsageDataPoint {
    timestamp: string;
    totalTokens: number;
}

export interface DailyUsageData {
    date: string;
    totalTokens: number;
}

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