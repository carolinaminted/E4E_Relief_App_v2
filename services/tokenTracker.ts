import type { TokenEvent, ModelPricing, UserProfile } from '../types';
import { usersRepo, tokenEventsRepo } from './firestoreRepo';

// --- State ---
let currentUser: UserProfile | null = null;
const currentAccount: string = 'E4E-Relief-Inc';
// In a real app, this might come from an environment variable
const currentEnv: 'Production' | 'Development' = 'Production';

const MODEL_PRICING: ModelPricing = {
  'gemini-2.5-flash': {
    input: 0.00035, // Price per 1000 tokens
    output: 0.00070,
  },
  'gemini-2.5-pro': {
    input: 0.0035,
    output: 0.0070,
  },
};

// --- Core Functions ---

/**
 * Initializes the tracker for a new user session or updates the user profile.
 */
export function init(user: UserProfile) {
  currentUser = user; 
  console.log('Token Tracker Initialized/Updated for user:', user.email);
}

/**
 * Resets the tracker on logout.
 */
export function reset() {
  currentUser = null;
  console.log('Token Tracker Reset.');
}

/**
 * A simple approximation for token counting since the SDK doesn't expose this.
 * A common rule of thumb is 1 token ~ 4 characters.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Logs a new AI interaction event. It updates the user's aggregate totals and
 * creates a new document in the `tokenEvents` collection in Firestore.
 */
export async function logEvent(data: {
  feature: TokenEvent['feature'];
  model: TokenEvent['model'];
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  sessionId: string;
}) {
  if (!currentUser) {
    console.warn('Token Tracker not initialized, skipping log.');
    return;
  }

  const totalTokens = data.inputTokens + (data.cachedInputTokens || 0) + data.outputTokens;
  const pricing = MODEL_PRICING[data.model] || { input: 0, output: 0 };
  const cost = ((data.inputTokens / 1000) * pricing.input) + ((data.outputTokens / 1000) * pricing.output);

  // Update aggregate totals on the user's profile document. Fire-and-forget.
  usersRepo.incrementTokenUsage(currentUser.uid, totalTokens, cost).catch(error => {
    console.error("Failed to update aggregate token usage in Firestore:", error);
  });

  const newEvent: Omit<TokenEvent, 'id'> = {
    uid: currentUser.uid,
    sessionId: data.sessionId,
    userId: currentUser.email,
    timestamp: new Date().toISOString(),
    feature: data.feature,
    model: data.model,
    inputTokens: data.inputTokens,
    cachedInputTokens: data.cachedInputTokens || 0,
    outputTokens: data.outputTokens,
    environment: currentEnv,
    account: currentAccount,
    fundCode: currentUser.fundCode,
  };

  // Create a detailed log document in the tokenEvents collection. Fire-and-forget.
  tokenEventsRepo.add(newEvent).catch(error => {
      console.error("Failed to log token event to Firestore:", error);
  });
}