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

### 1. Fund-Code-Driven Class Verification
- A mandatory verification step for new users that routes them to the correct verification method based on their employer's fund code.
- **Domain Verification:** Automatically verifies users if their email domain is on an approved list.
- **Roster Verification:** Requires users to provide information (e.g., Employee ID, Date of Birth) that is matched against a secure employee roster.
- **SSO Verification:** Allows users to verify their status by logging in with their company's Single Sign-On credentials.

### 2. AI Relief Assistant
- Interactive chatbot that guides users through application steps.
- Answers questions about eligibility, required documentation, and event types.
- Uses natural language processing to interpret user intent and provide contextual help.

### 3. AI-Powered Decisioning
- Evaluates applications against configurable, **fund-specific eligibility rules** (event type, timing, employment date, financial thresholds).
- Uses AI models to generate preliminary decisions and calculate remaining grant balances based on the specific fund's limits.
- Returns consistent and explainable outcomes with transparent rule enforcement.

### 4. Smart Application Prefill
- Automatically fills form fields using:
  - Prior user data (e.g., employment records, location).
  - AI-generated summaries of disaster descriptions.
  - Event metadata (e.g., hurricane name, fire date, region impact).
- Reduces applicant effort and submission errors.

### 5. Streamlined Workflow
- Applicants: Guided intake forms with eligibility checks and progress tracking.
- Reviewers: Access to structured data, AI explanations, and recommendation summaries.
- Admins: Monitoring dashboards for AI activity, token usage, and decision outcomes.

---

## Integration Points

- **Azure AD B2C**: Authentication and user management.
- **Dynamics 365**: Stores applicant, case, and grant award data.
- **Azure AI Foundry**: Hosts AI decisioning models and Relief Assistant agent.
- **Power Platform APIs**: Connect mobile inputs to backend workflow automation.
- **Application Insights**: Tracks AI response accuracy and system performance.

---

## Summary
The **E4E Relief Mobile App** transforms the traditional relief process into a **personalized, AI-assisted experience**.  
By automating repetitive tasks, interpreting disaster context, and enforcing eligibility with transparency, E4E achieves faster decisions, higher applicant satisfaction, and scalable relief distribution across programs and geographies.