import type { TokenEvent, TokenUsageTableRow, TopSessionData, LastHourUsageDataPoint, ModelPricing, TokenUsageFilters, UserProfile } from '../types';

// --- State ---
let sessionTokenEvents: TokenEvent[] = [];
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
 * Initializes the tracker for a new user session.
 */
export function init(user: UserProfile) {
  currentUser = user;
  sessionTokenEvents = [];
  console.log('Token Tracker Initialized for user:', user.email);
}

/**
 * Resets the tracker on logout.
 */
export function reset() {
  currentUser = null;
  sessionTokenEvents = [];
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
 * Logs a new AI interaction event to the in-memory session store.
 */
export function logEvent(data: {
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

  const newEvent: TokenEvent = {
    id: `evt-${Math.random().toString(36).substr(2, 9)}`,
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
  };

  sessionTokenEvents.push(newEvent);
  console.log('Logged Token Event:', newEvent);
}

// --- Data Retrieval Functions (for TokenUsagePage) ---

export function getTokenUsageTableData(filters: TokenUsageFilters): TokenUsageTableRow[] {
    const filteredEvents = sessionTokenEvents.filter(event => 
        (filters.account === 'all' || event.account === filters.account) &&
        (filters.user === 'all' || event.userId === filters.user) &&
        (filters.feature === 'all' || event.feature === filters.feature) &&
        (filters.model === 'all' || event.model === filters.model) &&
        (filters.environment === 'all' || event.environment === filters.environment)
    );

    const usageByFeatureInSession: { [key: string]: Omit<TokenUsageTableRow, 'user' | 'session' | 'feature'> } = {};

    for (const event of filteredEvents) {
        const key = `${event.userId}|${event.sessionId}|${event.feature}`;
        if (!usageByFeatureInSession[key]) {
            usageByFeatureInSession[key] = { input: 0, cached: 0, output: 0, total: 0, cost: 0 };
        }
        const pricing = MODEL_PRICING[event.model] || { input: 0, output: 0 };
        const eventCost = ((event.inputTokens / 1000) * pricing.input) + ((event.outputTokens / 1000) * pricing.output);

        usageByFeatureInSession[key].input += event.inputTokens;
        usageByFeatureInSession[key].cached += event.cachedInputTokens;
        usageByFeatureInSession[key].output += event.outputTokens;
        usageByFeatureInSession[key].total += event.inputTokens + event.cachedInputTokens + event.outputTokens;
        usageByFeatureInSession[key].cost += eventCost;
    }

    return Object.entries(usageByFeatureInSession).map(([key, data]) => {
        const [user, session, feature] = key.split('|');
        return { user, session, feature, ...data };
    });
}


export function getTopSessionData(filters: TokenUsageFilters): TopSessionData | null {
    const tableData = getTokenUsageTableData(filters);
    if (tableData.length === 0) return null;

    // Re-aggregate by session to find the true top session, as tableData is now granular by feature
    const usageBySession: { [sessionId: string]: TopSessionData } = {};
    for (const row of tableData) {
        if (!usageBySession[row.session]) {
            usageBySession[row.session] = {
                sessionId: row.session,
                inputTokens: 0,
                cachedInputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
            };
        }
        usageBySession[row.session].inputTokens += row.input;
        usageBySession[row.session].cachedInputTokens += row.cached;
        usageBySession[row.session].outputTokens += row.output;
        usageBySession[row.session].totalTokens += row.total;
    }

    const allSessions = Object.values(usageBySession);
    if (allSessions.length === 0) return null;

    // Find the session with the highest total token count
    const topSession = allSessions.reduce((max, current) => current.totalTokens > max.totalTokens ? current : max, allSessions[0]);
    
    return topSession;
}


export function getUsageLastHour(filters: TokenUsageFilters): LastHourUsageDataPoint[] {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const filteredEvents = sessionTokenEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= oneHourAgo &&
            (filters.account === 'all' || event.account === filters.account) &&
            (filters.user === 'all' || event.userId === filters.user) &&
            (filters.feature === 'all' || event.feature === filters.feature) &&
            (filters.model === 'all' || event.model === filters.model) &&
            (filters.environment === 'all' || event.environment === filters.environment)
    });

    // Create a map of usage per minute
    const usageByMinute: Map<string, number> = new Map();
    for (const event of filteredEvents) {
        const eventDate = new Date(event.timestamp);
        eventDate.setSeconds(0, 0); // Normalize to the start of the minute
        const minuteKey = eventDate.toISOString();
        const totalTokens = event.inputTokens + event.cachedInputTokens + event.outputTokens;
        usageByMinute.set(minuteKey, (usageByMinute.get(minuteKey) || 0) + totalTokens);
    }
    
    // Create a full 61-point array for every minute in the last hour for the chart
    const fullHourData: LastHourUsageDataPoint[] = [];
    for (let i = 0; i <= 60; i++) {
        const minuteTimestamp = new Date(oneHourAgo.getTime() + i * 60 * 1000);
        minuteTimestamp.setSeconds(0, 0);
        const minuteKey = minuteTimestamp.toISOString();
        
        fullHourData.push({
            timestamp: minuteKey,
            totalTokens: usageByMinute.get(minuteKey) || 0
        });
    }

    return fullHourData;
}


export function getFilterOptions() {
    if (!currentUser) return { features: [], models: [], environments: [], users: [], accounts: [] };
    
    const userEvents = sessionTokenEvents;
    const features = [...new Set(userEvents.map(e => e.feature))];
    const models = [...new Set(userEvents.map(e => e.model))];
    const environments = [...new Set(userEvents.map(e => e.environment))];
    const users = [...new Set(userEvents.map(e => e.userId))];
    const accounts = [...new Set(userEvents.map(e => e.account))];

    return { features, models, environments, users, accounts };
}