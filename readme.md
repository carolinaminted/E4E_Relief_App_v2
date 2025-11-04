# E4E Relief Mobile App — Business Overview

## Purpose
The **E4E Relief Mobile Application** streamlines the disaster relief grant application process for employees affected by qualifying events. It leverages AI-driven automation, decisioning, and conversational support to simplify eligibility, reduce processing time, and improve accessibility for applicants and case managers.

---

## Business Use Case

### Objective
To provide a **fast, secure, and guided experience** for employees applying for financial relief following disasters or hardships.  
The app integrates with **AI-powered systems** that help applicants understand eligibility, submit complete applications, and receive faster decisions — all while maintaining E4E Relief’s compliance, audit, and data integrity standards.

---

## Core Features

### 1. AI Relief Assistant
- Interactive chatbot that guides users through application steps.
- Answers questions about eligibility, required documentation, and event types.
- Uses natural language processing to interpret user intent and provide contextual help.

### 2. AI-Powered Decisioning
- Evaluates applications against configurable **eligibility rules** (event type, timing, employment date, financial thresholds).
- Uses AI models to generate preliminary decisions and calculate remaining grant balances.
- Returns consistent and explainable outcomes with transparent rule enforcement.

### 3. Smart Application Prefill
- Automatically fills form fields using:
  - Prior user data (e.g., employment records, location).
  - AI-generated summaries of disaster descriptions.
  - Event metadata (e.g., hurricane name, fire date, region impact).
- Reduces applicant effort and submission errors.

### 4. Event Awareness & Context
- The system identifies recent or ongoing disasters near the applicant’s location.
- Auto-suggests event types and dates using verified disaster data feeds.
- AI generates concise summaries (“Brief Descriptions”) of events for the application narrative section.

### 5. Streamlined Workflow
- Applicants: Guided intake forms with eligibility checks and progress tracking.
- Reviewers: Access to structured data, AI explanations, and recommendation summaries.
- Admins: Monitoring dashboards for AI activity, token usage, and decision outcomes.

---

## AI Capabilities Overview

| AI Capability | Description | Outcome |
|----------------|--------------|----------|
| **AI Relief Assistant** | Conversational agent for guidance and eligibility help | Reduces support burden |
| **AI Decisioning Engine** | Evaluates applications using rule logic + ML enrichment | Speeds up case processing |
| **AI Prefill & Descriptions** | Generates disaster summaries and fills missing fields | Improves data quality |
| **AI Insights Dashboard** | Tracks AI token usage and performance analytics | Enables cost visibility |

---

## Integration Points

- **Azure AD B2C**: Authentication and user management.
- **Dynamics 365**: Stores applicant, case, and grant award data.
- **Azure AI Foundry**: Hosts AI decisioning models and Relief Assistant agent.
- **Power Platform APIs**: Connect mobile inputs to backend workflow automation.
- **Application Insights**: Tracks AI response accuracy and system performance.

---

## Benefits

| Stakeholder | Benefit |
|--------------|----------|
| **Applicants** | Fast, intuitive, mobile-first grant experience |
| **Case Reviewers** | Pre-screened and AI-validated applications |
| **E4E Relief** | Reduced processing time, improved accuracy, transparent AI logs |
| **Client Organizations** | Employee confidence in timely, data-secure assistance |

---

## Example Use Flow

1. **User opens the app** → Signs in via company or B2C account.  
2. **AI Relief Assistant** greets the user and asks what event occurred.  
3. **User describes the event** → AI generates a brief event summary.  
4. **Eligibility Engine** checks employment start date, event recency, and grant limits.  
5. **Application is prefilled** → User reviews and submits.  
6. **AI Decisioning** runs → Result and remaining grant amount displayed.  
7. **Status updates** and **support chat** available via the app.

---

## Future Enhancements
- Multilingual AI support for global deployments.
- Predictive grant forecasting using past event patterns.
- Offline-first mode for disaster zones with low connectivity.
- Real-time integration with FEMA or NOAA for verified event matching.

---

## Developer Notes

### Class Verification Feature

This feature introduces a mandatory verification step for new users before they can access the application submission functionality. It is always enabled in this version.

**Feature Flag (Conceptual):**
- **Location:** `src/config/flags.ts` (hypothetical, as there's no flags file yet)
- **Flag:** `classVerificationEnabled: true`
- **Behavior:** When `true`, new users are directed to the Class Verification flow. When `false`, this flow is bypassed, and new users can access the application forms immediately after registration.

**Risks & Considerations:**
- **API Dependency:** The Roster and SSO verification methods rely on external or backend APIs. API downtime will prevent users from completing verification through those paths. The Domain verification is client-side but relies on configuration fetched from an API.
- **User Lockout:** If a user cannot complete any of the verification methods (e.g., they are a new employee not yet in the roster, they use a personal email), they will be locked out from applying for relief. A clear support path must be available.
- **Secure Storage:** The `fundCode` and `classVerificationStatus` are persisted in the user's session. On a shared device, this could expose the fund code if not cleared properly on logout. The current implementation clears this state on logout.

---

## Summary
The **E4E Relief Mobile App** transforms the traditional relief process into a **personalized, AI-assisted experience**.  
By automating repetitive tasks, interpreting disaster context, and enforcing eligibility with transparency, E4E achieves faster decisions, higher applicant satisfaction, and scalable relief distribution across programs and geographies.