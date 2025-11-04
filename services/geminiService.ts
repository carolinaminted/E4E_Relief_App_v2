import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import type { Application, Address, UserProfile, ApplicationFormData, EventData, EligibilityDecision } from '../types';
import { logEvent as logTokenEvent, estimateTokens } from './tokenTracker';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateSessionId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

const addressSchema = {
    type: Type.OBJECT,
    properties: {
        country: { type: Type.STRING, description: "The country of the address." },
        street1: { type: Type.STRING, description: "The primary street line of the address." },
        street2: { type: Type.STRING, description: "The secondary street line (e.g., apartment number)." },
        city: { type: Type.STRING, description: "The city of the address." },
        state: { type: Type.STRING, description: "The state or province of the address." },
        zip: { type: Type.STRING, description: "The ZIP or postal code of the address." },
    }
};

const updateUserProfileTool: FunctionDeclaration = {
  name: 'updateUserProfile',
  description: 'Updates the user profile information based on details provided in the conversation. Can be used for one or more fields at a time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      firstName: { type: Type.STRING, description: 'The user\'s first name.' },
      middleName: { type: Type.STRING, description: 'The user\'s middle name.' },
      lastName: { type: Type.STRING, description: 'The user\'s last name.' },
      suffix: { type: Type.STRING, description: 'A suffix for the user\'s name, like Jr. or III.' },
      mobileNumber: { type: Type.STRING, description: 'The user\'s mobile phone number.' },
      primaryAddress: { ...addressSchema, description: "The user's primary residential address." },
      employmentStartDate: { type: Type.STRING, description: 'The date the user started their employment, in YYYY-MM-DD format.' },
      householdIncome: { type: Type.NUMBER, description: 'The user\'s estimated annual household income as a number.' },
      householdSize: { type: Type.NUMBER, description: 'The number of people in the user\'s household.' },
      homeowner: { type: Type.STRING, description: 'Whether the user owns their home.', enum: ['Yes', 'No'] },
    },
  },
};

const startOrUpdateApplicationDraftTool: FunctionDeclaration = {
  name: 'startOrUpdateApplicationDraft',
  description: 'Creates or updates a draft for a relief application with event-specific details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      event: { type: Type.STRING, description: "The type of event the user is applying for relief from.", enum: ['Flood', 'Tornado', 'Tropical Storm/Hurricane', 'Wildfire', 'My disaster is not listed'] },
      otherEvent: { type: Type.STRING, description: "The user-specified disaster if 'My disaster is not listed' is the event type." },
      eventDate: { type: Type.STRING, description: "The date the disaster occurred, in YYYY-MM-DD format." },
      evacuated: { type: Type.STRING, description: "Whether the user evacuated or plans to.", enum: ['Yes', 'No'] },
      evacuatingFromPrimary: { type: Type.STRING, description: "Whether the evacuation is from their primary residence.", enum: ['Yes', 'No'] },
      evacuationReason: { type: Type.STRING, description: "The reason for evacuation if not from primary residence." },
      stayedWithFamilyOrFriend: { type: Type.STRING, description: "Whether the user stayed with family or friends during evacuation.", enum: ['Yes', 'No'] },
      evacuationStartDate: { type: Type.STRING, description: "The start date of the evacuation, in YYYY-MM-DD format." },
      evacuationNights: { type: Type.NUMBER, description: "The number of nights the user was or will be evacuated." },
      powerLoss: { type: Type.STRING, description: "Whether the user lost power for more than 4 hours.", enum: ['Yes', 'No'] },
      powerLossDays: { type: Type.NUMBER, description: "The number of days the user was without power." },
      additionalDetails: { type: Type.STRING, description: "Any additional details provided by the user about their situation." },
      requestedAmount: { type: Type.NUMBER, description: 'The amount of financial relief the user is requesting.' },
    },
  },
};


const applicationContext = `
You are the Relief Assistant, an expert AI chatbot for the 'E4E Relief' application.

Your **PRIMARY GOAL** is to proactively help users start or update their relief application by having a natural conversation. Listen for key pieces of information, and when you have them, use your available tools to update the application draft.

**Your Capabilities & Tools**:
- You can update a user's profile information using the \`updateUserProfile\` tool.
- You can start or update an application draft with event details using the \`startOrUpdateApplicationDraft\` tool.
- You can answer general questions about the application process, pages (Home, Apply, Profile, Support), and how to get support.

**Conversational Flow**:
1.  **Listen and Extract**: When a user provides information (e.g., "I'm John Doe, I live in Charlotte, NC, was affected by the recent flood and need $1500"), extract the entities (\`firstName: "John"\`, \`lastName: "Doe"\`, \`primaryAddress: { city: "Charlotte", state: "NC" }\`, \`event: "Flood"\`, \`requestedAmount: 1500\`).
2.  **Use Your Tools**: Call the appropriate tool(s) with the extracted information. You can call multiple tools at once if the user provides enough information.
3.  **Confirm Your Actions**: After you call a tool, you MUST confirm what you've done. For example: "Thanks, John. I've updated your name and location, and started a draft application for the 'Flood' event with a requested amount of $1,500."
4.  **Ask Clarifying Questions**: If information is missing, ask for it. For example, if a user says "I was in a tornado," respond with something like: "I'm sorry to hear that. I've noted the event as 'Tornado'. What was the date of the event, and how much financial assistance are you requesting?"
5.  **Be Helpful**: If the user just wants to ask a question, answer it based on the application context below.

---
**Application Context for Q&A**:
- **Purpose**: The app allows users to apply for financial assistance during times of need.
- **Support Info**: Email is support@e4erelief.example, Phone is (800) 555-0199.

**Response Style**:
- Your answers MUST be short and concise. Get straight to the point.
- When you provide a list of items, you MUST format it as a clean, bulleted list using hyphens.
- Do NOT use asterisks. Keep the text clean.
---
`;


export function createChatSession(applications?: Application[]): Chat {
  let dynamicContext = applicationContext;

  if (applications && applications.length > 0) {
    const applicationList = applications.map(app => {
      let appDetails = `Application ID: ${app.id}\nEvent: ${app.event}\nAmount: $${app.requestedAmount}\nSubmitted: ${app.submittedDate}\nStatus: ${app.status}`;
      if (app.reasons && (app.status === 'Declined' || app.status === 'Submitted')) {
        appDetails += `\nDecision Reasons: ${app.reasons.join(' ')}`;
      }
      return appDetails;
    }).join('\n---\n');

    dynamicContext += `
**User's Application History**:
You have access to the user's submitted applications. If they ask about one, use this data. 
If an application status is 'Declined' or 'Submitted' (which means 'Under Review'), you MUST use the 'Decision Reasons' provided to explain why. Be direct and clear.
${applicationList}
`;
  } else {
    dynamicContext += `\nThe user currently has no submitted applications.`;
  }
  
  const model = 'gemini-2.5-flash';
  return ai.chats.create({
    model: model,
    config: {
      systemInstruction: dynamicContext,
    },
    tools: [{ functionDeclarations: [updateUserProfileTool, startOrUpdateApplicationDraftTool] }],
  });
}

export function evaluateApplicationEligibility(
  appData: {
    id: string;
    employmentStartDate: string;
    eventData: EventData;
    currentTwelveMonthRemaining: number;
    currentLifetimeRemaining: number;
  }
): EligibilityDecision {
  const { eventData, currentTwelveMonthRemaining, currentLifetimeRemaining, employmentStartDate } = appData;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

  const policy_hits: EligibilityDecision['policy_hits'] = [];
  const reasons: string[] = [];
  let decision: EligibilityDecision['decision'] = 'Approved';

  const eventDateStr = eventData.eventDate || '';
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;
  if (eventDate) {
    eventDate.setHours(0,0,0,0);
  }

  const requestedAmount = Number(eventData.requestedAmount) || 0;
  const normalizedEvent = eventData.event === 'My disaster is not listed' ? (eventData.otherEvent || '').trim() : (eventData.event || '').trim();
  
  if (!normalizedEvent) {
    decision = 'Denied';
    reasons.push("An event type must be selected. If 'My disaster is not listed' is chosen, the specific event must be provided.");
    policy_hits.push({ rule_id: 'R1', passed: false, detail: `Event field (201: ${eventData.event}, 202: ${eventData.otherEvent}) resulted in an empty event name.` });
  } else {
    policy_hits.push({ rule_id: 'R1', passed: true, detail: `Event specified as '${normalizedEvent}'.` });
  }

  if (!eventDate || isNaN(eventDate.getTime()) || eventDate < ninetyDaysAgo || eventDate > today) {
    decision = 'Denied';
    reasons.push(`Event date is older than 90 days or invalid. Event must be between ${ninetyDaysAgoStr} and today.`);
    policy_hits.push({ rule_id: 'R2', passed: false, detail: `Event date '${eventDateStr}' is outside the 90-day window starting from '${ninetyDaysAgoStr}'.` });
  } else {
    policy_hits.push({ rule_id: 'R2', passed: true, detail: `Event date '${eventDateStr}' is recent.` });
  }

  const empStartDate = employmentStartDate ? new Date(employmentStartDate) : null;
  if (empStartDate) empStartDate.setHours(0,0,0,0);
  if (!empStartDate || isNaN(empStartDate.getTime()) || (eventDate && empStartDate > eventDate)) {
    decision = 'Denied';
    reasons.push("Employment start date is invalid or after the event date.");
    policy_hits.push({ rule_id: 'R3', passed: false, detail: `Employment start date '${employmentStartDate}' is after event date '${eventDateStr}'.` });
  } else {
    policy_hits.push({ rule_id: 'R3', passed: true, detail: 'Employment start date is valid.' });
  }

  if (requestedAmount <= 0) {
     decision = 'Denied';
     reasons.push(`Requested amount must be greater than zero.`);
     policy_hits.push({ rule_id: 'R4/R5', passed: false, detail: `Requested amount of $${requestedAmount.toFixed(2)} is not greater than zero.` });
  } else if (requestedAmount > 10000) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the maximum of $10,000.`);
    policy_hits.push({ rule_id: 'R5', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds absolute cap of $10,000.` });
  } else if (requestedAmount > currentTwelveMonthRemaining) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the remaining 12-month limit of $${currentTwelveMonthRemaining.toFixed(2)}.`);
    policy_hits.push({ rule_id: 'R4', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds 12-month limit $${currentTwelveMonthRemaining.toFixed(2)}.` });
  } else if (requestedAmount > currentLifetimeRemaining) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the remaining lifetime limit of $${currentLifetimeRemaining.toFixed(2)}.`);
    policy_hits.push({ rule_id: 'R4', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds lifetime limit $${currentLifetimeRemaining.toFixed(2)}.` });
  } else {
    policy_hits.push({ rule_id: 'R4', passed: true, detail: `Requested amount $${requestedAmount.toFixed(2)} is within all limits.` });
    policy_hits.push({ rule_id: 'R5', passed: true, detail: `Requested amount $${requestedAmount.toFixed(2)} is within absolute cap.` });
  }

  if (decision !== 'Denied') {
    if (eventData.evacuated === 'Yes') {
      const missingEvacFields = !eventData.evacuatingFromPrimary || !eventData.stayedWithFamilyOrFriend || !eventData.evacuationStartDate || !eventData.evacuationNights || eventData.evacuationNights <= 0;
      if (missingEvacFields) {
        decision = 'Review';
        reasons.push("Evacuation was indicated, but required details (e.g., evacuation start date, number of nights) are missing or invalid.");
        policy_hits.push({ rule_id: 'R6', passed: false, detail: 'Evacuation indicated (204: Yes) but required fields are missing or invalid.' });
      } else {
        policy_hits.push({ rule_id: 'R6', passed: true, detail: 'Evacuation fields are complete.' });
      }
    }

    if (eventData.powerLoss === 'Yes') {
      if (!eventData.powerLossDays || eventData.powerLossDays <= 0) {
        decision = 'Review';
        reasons.push("Power loss was indicated, but the number of days is missing or invalid.");
        policy_hits.push({ rule_id: 'R6', passed: false, detail: `Power loss indicated (210: Yes) but powerLossDays (211: ${eventData.powerLossDays || 'N/A'}) is invalid.` });
      } else {
        policy_hits.push({ rule_id: 'R6', passed: true, detail: 'Power loss fields are complete.' });
      }
    }
  }

  let normalizedPowerLossDays = Number(eventData.powerLossDays) || 0;
  if (eventData.powerLoss === 'No' && normalizedPowerLossDays > 0) {
    const originalDays = normalizedPowerLossDays;
    normalizedPowerLossDays = 0;
    policy_hits.push({ rule_id: 'R7', passed: true, detail: `PowerLoss was 'No' (210), but powerLossDays was ${originalDays}. Coerced to 0.` });
  }

  if (reasons.length === 0 && decision === 'Approved') {
    reasons.push("Application meets all automatic approval criteria.");
  }
  
  let recommended_award = 0;
  let remaining_12mo = currentTwelveMonthRemaining;
  let remaining_lifetime = currentLifetimeRemaining;

  if (decision === 'Approved') {
    recommended_award = Math.min(requestedAmount, currentTwelveMonthRemaining, currentLifetimeRemaining);
    remaining_12mo -= recommended_award;
    remaining_lifetime -= recommended_award;
  }
  
  return {
    decision,
    reasons,
    policy_hits,
    recommended_award,
    remaining_12mo,
    remaining_lifetime,
    normalized: {
      event: normalizedEvent,
      eventDate: eventDate?.toISOString().split('T')[0] || eventDateStr,
      evacuated: eventData.evacuated || '',
      powerLossDays: normalizedPowerLossDays
    },
    decisionedDate: today.toISOString().split('T')[0]
  };
}

const finalDecisionSchema = {
    type: Type.OBJECT,
    properties: {
        finalDecision: { type: Type.STRING, enum: ['Approved', 'Denied'], description: "Your final decision." },
        finalReason: { type: Type.STRING, description: "A single, concise, and empathetic reason for your final decision. This will be shown to the user." },
        finalAward: { type: Type.NUMBER, description: "The calculated award amount if the decision is 'Approved', otherwise 0. It is the minimum of the requested amount, the 12-month remaining balance, and the lifetime remaining balance." }
    },
    required: ["finalDecision", "finalReason", "finalAward"]
};


export async function getAIAssistedDecision(
    appData: {
        eventData: EventData,
        currentTwelveMonthRemaining: number,
        currentLifetimeRemaining: number,
    },
    preliminaryDecision: EligibilityDecision
): Promise<EligibilityDecision> {
    const prompt = `
        You are a senior grant approver AI. Your task is to perform a final review of a relief application.
        An automated, deterministic rules engine has already processed the application and provided a preliminary decision. You have the final say.

        **Instructions:**
        1.  **Review all provided information holistically.**
        2.  **Make a final decision:** 'Approved' or 'Denied'. Your decision is final.
        3.  **If you decide to approve**, you MUST calculate the final award amount. The award is the MINIMUM of these three values: the 'requestedAmount', the '12-Month Remaining' balance, and the 'Lifetime Remaining' balance. If you deny, the award is 0.
        4.  **Write a single, concise, and empathetic reason for your decision.** This will be shown directly to the applicant.
            -   **For Approvals:** Start with a positive confirmation. State the approved event and include the calculated award amount. Example: "Congratulations, your application for relief from the Flood has been approved for an award of $1500.00."
            -   **For Denials:** Be clear and direct, but empathetic. State the primary reason for the denial based on the preliminary findings. Example: "We're sorry, but your application could not be approved because the requested amount exceeds your available lifetime grant limit."
        5.  **Your response MUST be in JSON format and adhere to the specified schema.**

        ---
        APPLICANT'S SUBMITTED DATA:
        ${JSON.stringify(appData.eventData, null, 2)}
        
        CURRENT GRANT BALANCES:
        - 12-Month Remaining: $${appData.currentTwelveMonthRemaining}
        - Lifetime Remaining: $${appData.currentLifetimeRemaining}

        ---
        PRELIMINARY AUTOMATED DECISION:
        ${JSON.stringify(preliminaryDecision, null, 2)}
        ---
    `;
    const model = 'gemini-2.5-flash';
    const inputTokens = estimateTokens(prompt);
    const sessionId = generateSessionId('ai-decisioning');

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: finalDecisionSchema,
            },
        });
        
        const outputTokens = estimateTokens(response.text);
        logTokenEvent({ feature: 'Final Decision', model, inputTokens, outputTokens, sessionId });

        const jsonString = response.text.trim();
        const aiResponse = JSON.parse(jsonString) as { finalDecision: 'Approved' | 'Denied', finalReason: string, finalAward: number };

        const finalRecommendedAward = aiResponse.finalAward;
        let finalRemaining12mo = appData.currentTwelveMonthRemaining;
        let finalRemainingLifetime = appData.currentLifetimeRemaining;

        if (aiResponse.finalDecision === 'Approved') {
            finalRemaining12mo -= finalRecommendedAward;
            finalRemainingLifetime -= finalRecommendedAward;
        }

        return {
            ...preliminaryDecision, // Carry over normalized data and policy hits for audit
            decision: aiResponse.finalDecision,
            reasons: [aiResponse.finalReason], // Use the AI's reason as the definitive one
            recommended_award: finalRecommendedAward,
            remaining_12mo: finalRemaining12mo,
            remaining_lifetime: finalRemainingLifetime,
        };

    } catch (error) {
        console.error("Gemini final decision failed:", error);
        // Fallback: If AI fails, trust the preliminary decision to avoid halting the process
        return {
            ...preliminaryDecision,
            reasons: [...preliminaryDecision.reasons, "AI final review failed; this decision is based on the automated rules engine only."],
        };
    }
}


const addressJsonSchema = {
    type: Type.OBJECT,
    properties: {
        street1: { type: Type.STRING, description: "The primary street line, including street number and name. Formatted in Title Case (e.g., '123 Main St')." },
        street2: { type: Type.STRING, description: "The secondary street line (e.g., apartment, suite, or unit number). Formatted in Title Case (e.g., 'Apt 4B')." },
        city: { type: Type.STRING, description: "The city, formatted in Title Case (e.g., 'New York')." },
        state: { type: Type.STRING, description: "The state or province. For US addresses, use the uppercase 2-letter abbreviation (e.g., 'CA')." },
        zip: { type: Type.STRING, description: "The ZIP or postal code." },
        country: { type: Type.STRING, description: "The country, formatted in Title Case (e.g., 'United States')." },
    },
    required: ["street1", "city", "state", "zip", "country"]
};

export async function parseAddressWithGemini(addressString: string): Promise<Partial<Address>> {
  if (!addressString) return {};

  const prompt = `
    Parse the provided address string into a structured JSON object.
    Rules:
    1. For addresses in the United States, validate and correct any misspellings in the street name, city, or state.
    2. Standardize capitalization:
       - Street names and city should be in Title Case (e.g., "Main Street", "San Francisco").
       - The state for US addresses must be a 2-letter uppercase abbreviation (e.g., "CA").
    3. Omit any keys for address components that are not present in the original string (like \`street2\`).
    
    Address to parse: "${addressString}"
  `;
  const model = 'gemini-2.5-flash';
  const inputTokens = estimateTokens(prompt);
  const sessionId = generateSessionId('ai-address-parsing');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: addressJsonSchema,
      },
    });

    const outputTokens = estimateTokens(response.text);
    logTokenEvent({ feature: 'Address Parsing', model, inputTokens, outputTokens, sessionId });

    const jsonString = response.text.trim();
    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      // Filter out null values before returning
      Object.keys(parsed).forEach(key => {
        if (parsed[key] === null) {
          delete parsed[key];
        }
      });
      return parsed as Partial<Address>;
    }
    return {};
  } catch (error) {
    console.error("Gemini address parsing failed:", error);
    throw new Error("Failed to parse address with AI.");
  }
}

const applicationDetailsJsonSchema = {
    type: Type.OBJECT,
    properties: {
        profileData: {
            type: Type.OBJECT,
            properties: {
                firstName: { type: Type.STRING, description: 'The user\'s first name.' },
                lastName: { type: Type.STRING, description: 'The user\'s last name.' },
                primaryAddress: { ...addressSchema, description: "The user's primary residential address." },
                employmentStartDate: { type: Type.STRING, description: 'The date the user started their employment, in YYYY-MM-DD format.' },
                eligibilityType: { type: Type.STRING, description: 'The user\'s employment type.', enum: ['Full-time', 'Part-time', 'Contractor'] },
                householdIncome: { type: Type.NUMBER, description: 'The user\'s estimated annual household income as a number.' },
                householdSize: { type: Type.NUMBER, description: 'The number of people in the user\'s household.' },
                homeowner: { type: Type.STRING, description: 'Whether the user owns their home.', enum: ['Yes', 'No'] },
                mobileNumber: { type: Type.STRING, description: "The user's mobile phone number." },
                preferredLanguage: { type: Type.STRING, description: "The user's preferred language for communication." },
            }
        },
        eventData: {
            type: Type.OBJECT,
            properties: {
                event: { type: Type.STRING, description: "The type of event the user is applying for relief from.", enum: ['Flood', 'Tornado', 'Tropical Storm/Hurricane', 'Wildfire', 'My disaster is not listed'] },
                otherEvent: { type: Type.STRING, description: "The user-specified disaster if 'My disaster is not listed' is the event type." },
                eventDate: { type: Type.STRING, description: "The date the disaster occurred, in YYYY-MM-DD format." },
                evacuated: { type: Type.STRING, description: "Whether the user evacuated or plans to.", enum: ['Yes', 'No'] },
                powerLoss: { type: Type.STRING, description: "Whether the user lost power for more than 4 hours.", enum: ['Yes', 'No'] },
                powerLossDays: { type: Type.NUMBER, description: "The number of days the user was without power." },
                additionalDetails: { type: Type.STRING, description: "Any additional details provided by the user about their situation." },
                requestedAmount: { type: Type.NUMBER, description: 'The amount of financial relief the user is requesting.' },
            }
        }
    }
};

export async function parseApplicationDetailsWithGemini(
  description: string
): Promise<Partial<ApplicationFormData>> {
  if (!description) return {};

  const prompt = `
    Parse the user's description of their situation into a structured JSON object for a relief application.
    Extract any mentioned details that match the schema, including personal info, address, event details (like evacuation status or power loss), and other profile information.
    
    Rules for address parsing:
    1. For addresses in the United States, validate and correct any misspellings in the street name, city, or state.
    2. Standardize capitalization:
       - Street names and city should be in Title Case (e.g., "Main Street", "San Francisco").
       - The state for US addresses must be a 2-letter uppercase abbreviation (e.g., "CA").
    3. Omit any keys for address components that are not present in the original string (like \`street2\`).

    Rules for other fields:
    1. eventDate, employmentStartDate: Must be in YYYY-MM-DD format. Infer the year if not specified (assume current year).
    2. householdIncome, powerLossDays: Extract as a number, ignoring currency symbols or commas.
    3. homeowner, evacuated, powerLoss: Should be "Yes" or "No".
    4. mobileNumber: Extract any phone number mentioned by the user.

    User's description: "${description}"
  `;
  const model = 'gemini-2.5-flash';
  const inputTokens = estimateTokens(prompt);
  const sessionId = generateSessionId('ai-app-parsing');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: applicationDetailsJsonSchema,
      },
    });

    const outputTokens = estimateTokens(response.text);
    logTokenEvent({ feature: 'Application Parsing', model, inputTokens, outputTokens, sessionId });

    const jsonString = response.text.trim();
    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      // Clean up nulls
      if (parsed.profileData) {
        Object.keys(parsed.profileData).forEach(key => {
            if (parsed.profileData[key] === null) delete parsed.profileData[key];
        });
        if (parsed.profileData.primaryAddress) {
            Object.keys(parsed.profileData.primaryAddress).forEach(key => {
                if (parsed.profileData.primaryAddress[key] === null) delete parsed.profileData.primaryAddress[key];
            });
        }
      }
      if (parsed.eventData) {
          Object.keys(parsed.eventData).forEach(key => {
            if (parsed.eventData[key] === null) delete parsed.eventData[key];
        });
      }
      return parsed as Partial<ApplicationFormData>;
    }
    return {};
  } catch (error) {
    console.error("Gemini application details parsing failed:", error);
    throw new Error("Failed to parse application details with AI.");
  }
}