# Regression Suite: AI Features

**Priority:** High
**Prerequisites:** User is logged in, verified, and eligible.

## TC-011: AI Application Starter (Apply Page)
**Objective:** Use the text box on Step 1 to pre-fill the form.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **Apply** page. | Step 1 loads. "Let's Get Started" section is visible. |
| 2 | Expand "Let AI fill in...". | Text area appears. |
| 3 | Paste: *"I lost power for 4 days due to the Hurricane. I need $400 for spoiled food."* | |
| 4 | Click "Submit Description". | Spinner appears. After a few seconds, success message appears. |
| 5 | **Check:** Form Data | "Event" is set to "Tropical Storm/Hurricane". "Power Loss" is "Yes". "Days" is "4". |
| 6 | Click "Next" to Expenses. | "Food Spoilage" amount is pre-filled with `400`. |

## TC-012: AI Apply (Conversational Flow)
**Objective:** Message the entire application via chatbot and submit.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **AI Apply** from Home. | **Desktop:** Split screen (Chat left, Preview right). **Mobile:** Chat full screen. |
| 2 | **Chat:** "I need help applying for relief." | AI acknowledges and asks for missing profile info (e.g., "Are you a homeowner?"). |
| 3 | **Chat:** "Yes I own my home. I make $50k a year. Household of 3." | AI updates "Additional Details" section in Preview pane. Green checkmarks appear. |
| 4 | **Chat:** Confirm Acknowledgements (Policy, Consent, Accuracy). | AI updates "Profile Acknowledgements" section. Moves to Event. |
| 5 | **Chat:** "It was a flood yesterday. Power was out for 2 days." | AI updates "Event Details" section. Asks about expenses. |
| 6 | **Chat:** "I spent $500 on food and $200 on supplies." | AI updates "Expenses" section. Preview shows Total: $700. |
| 7 | **Chat:** "I agree to share my story and receive info." | AI updates "Agreements" section. |
| 8 | **Action:** Click "Terms of Acceptance" in Preview pane (Agreements section). | Modal opens. Close it. |
| 9 | **Action:** Check the Terms box in Preview pane. | |
| 10 | **Action:** Click "Submit Application" button in Preview pane. | Loading state. Redirects to Submission Success Page. |

## TC-013: Admin Proxy Application (AI Assisted)
**Objective:** Admin uses AI to parse an email/description for a proxy applicant.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as **Admin**. Navigate to **Fund Portal**. | |
| 2 | Click "Proxy". | Proxy Application page loads. |
| 3 | Use "Let AI fill in..." at top. | |
| 4 | Paste: *"Applying for pikachu.raichu@example.com. They lost their home in a fire."* | |
| 5 | Click Submit. | AI extracts email and event. |
| 6 | **Check:** Search Result | "Applicant Found: Pikachu Raichu" appears below. |
| 7 | Click "Start Application for this User". | Wizard loads with "House Fire" pre-selected in Step 2. |

## TC-014: Verify Token Analytics Logging
**Objective:** Confirm that the AI interactions in TC-011, TC-012, and TC-013 generated token logs.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as **Admin**. Navigate to **Fund Portal**. | |
| 2 | Click "Tokens". | Token Usage Dashboard loads. |
| 3 | **Check:** Top Metrics | "Cost" and "Tokens Used" cards display non-zero values. |
| 4 | **Check:** "Session Tokens (Last Hour)" | Chart shows bars/points indicating recent activity. |
| 5 | Scroll to "Detailed Token Usage" table. | |
| 6 | **Verify:** AI Starter Event | Look for a row with Feature: `Application Parsing` (from TC-011/013). |
| 7 | **Verify:** Chat Events | Look for rows with Feature: `AI Assistant` (from TC-012). |
| 8 | **Verify:** Decision Event | Look for a row with Feature: `Final Decision` (triggered upon submission in TC-012). |