# E4E Relief — User Guide

This guide will walk you through all the features of the E4E Relief application, from creating an account and applying for a grant to using the advanced AI tools and administrative features.

## Getting Started

### Registration & Sign In
-   Open the app and choose **Register** to create a new account or **Sign In** if you already have one.
-   When registering, you will need a **Fund Code** provided by your employer or program.

### Secret Shortcuts (For Demo & Testing)
-   **On the Register page:** Click the E4E Relief logo to automatically fill in the form with randomly generated user data.
-   **On the Login page:** Click the E4E Relief logo to automatically fill in the credentials for the **admin user** (`admin@example.com`).

---

## Class Verification
After your first sign-in, you must complete a one-time verification to confirm your eligibility for your designated fund. The method depends on your employer's program configuration.

-   **Domain Verification**: Your account is automatically verified if your email address (e.g., `you@company.com`) uses a company-approved domain.
-   **Roster Verification**: You will be asked to enter specific details like your Employee ID and date of birth, which are then matched against secure company records.
-   **SSO Verification**: You will be prompted to log in with your company's Single Sign-On (SSO) to securely link your E4E Relief account.

Once verified, you will have full access to the application. If your eligibility status is `Inactive`, you may need to complete this step to apply for relief.

---

## Main Dashboard (Home)
The home screen provides quick access to all major sections of the app.

-   **Apply**: Start a new application for financial assistance. (This is only enabled if your status is 'Active').
-   **Profile**: View past applications and update your personal details.
-   **Support**: Find contact information and answers to frequently asked questions.
-   **Donate**: Make a contribution to the relief fund.
-   **Dashboards** (Admin only): Access the Fund Portal for administrative features.

---

## Applying for Relief
The application is a guided, multi-step form. Your progress is saved as you move through the steps.

### Step 1: Contact, Address & Profile
-   **AI Application Starter**: You can start by describing your situation in your own words. The AI will parse the text and pre-fill as many fields as possible throughout the application, including your contact info, address, event details, and requested amount.
-   **Manual Entry**: You can fill out the form manually. The application is organized into collapsible sections for contact details, primary address, mailing address, and other personal information. The AI-powered **Address Helper** can parse a pasted address to fill in the fields for you.

### Step 2: Event Details
-   Select the type of disaster or hardship event.
-   Provide the date of the event, details about power loss or evacuation, and the amount you are requesting.

### Step 3: Expenses
-   Itemize your expenses based on predefined categories (e.g., Food Spoilage, Meals).
-   You can add, edit, or delete expenses. Receipts are optional but can be uploaded.

### Step 4: Agreements & Submission
-   Review and agree to the Terms of Acceptance.
-   Indicate your preferences for sharing your story and receiving additional information.
-   Once you submit, your application is sent for an instant decision.

### Submission Success
-   After submission, you will see a confirmation page with your unique Application ID.
-   Your application will now appear in the "My Applications" section of your Profile page.

---

## Managing Your Account

### Profile Page
-   **My Applications**: View a list of all your past submissions with their status (Submitted, Awarded, Declined). Click any application to see a detailed summary in a modal window.
-   **Grant Limits**: See your remaining 12-month and lifetime grant balances.
-   **Update Information**: All your personal details are organized in collapsible sections. You can update your contact info, addresses, employment details, and consent preferences here.

---

## AI-Powered Features

### Relief Assistant (AI Chatbot)
The Relief Assistant is a powerful AI chatbot available via the floating widget. It can:
-   **Answer Questions**: Ask about the application process, eligibility criteria, or where to find information in the app.
-   **Understand Your History**: The assistant is aware of your past applications and can provide status updates or explain decision reasons.
-   **Update Your Profile**: Ask the assistant to update your information. For example: *"My new phone number is 555-867-5309."*
-   **Start an Application**: Describe your situation to the assistant. For example: *"I was affected by the recent flood and need $1500 for repairs."* The assistant will use this information to create a draft, which will pre-fill the form when you navigate to the **Apply** page.

### AI Decisioning & Instant Grants
When you submit an application, it goes through a two-stage automated decisioning process for an instant result.
1.  **Rules Engine Evaluation**: The application is first checked against a set of deterministic, hard-coded rules (e.g., Is the event date within 90 days? Does the requested amount exceed fund limits?). This generates a preliminary decision (`Approved`, `Denied`, or `Review`).
2.  **AI Final Review**: The application data and the preliminary decision are sent to a Gemini model. The AI acts as a senior grant approver, holistically reviews the case, and makes the final binding decision. It also generates a concise, empathetic reason for the outcome, which is shown to you.

This process ensures decisions are fast, consistent, and transparent.

---

## Fund Portal (For Admins)
If you are logged in as an admin, you have access to the Fund Portal, a central hub for managing the relief program.

-   **Dashboard**: A high-level overview of key metrics, including total grants awarded, application statuses, user engagement, and top event types.
-   **Ticketing**: A simple system for viewing and managing support tickets submitted by users.
-   **Program Details**: A summary of the configuration for the selected fund, including grant limits and eligible event types.
-   **Proxy Applications**: Submit an application on behalf of another employee. This is useful for users who may not have easy access to the app.
-   **Token Usage**: An analytics dashboard to monitor the usage and cost of the Gemini AI models across different features (AI Assistant, Decisioning, etc.).

---

## Page Hierarchy for Screenshots

Here is a complete map of every page and view in the application.

-   **Logged Out Experience**
    -   Login Page
    -   Register Page

-   **Initial User Flow**
    -   Class Verification Page
        -   Domain Verification View
        -   Roster Verification View
        -   SSO Verification View
        -   Verification Success View

-   **Main Application (Standard User)**
    -   Home Page
    -   Apply for Relief (Wrapper Page)
        -   Step 1: Contact Page (`ApplyContactPage`)
            -   AI Application Starter
            -   Address Helper
        -   Step 2: Event Page (`ApplyEventPage`)
        -   Step 3: Expenses Page (`ApplyExpensesPage`)
        -   Step 4: Terms Page (`ApplyTermsPage`)
            -   Terms of Acceptance Modal
    -   Submission Success Page
    -   Profile Page
        -   Application Detail Modal
    -   Support Page
    -   FAQ Page
    -   Payment Options Page
    -   Donate Page
    -   Eligibility Page
    -   Policy Modal (from Home page footer)

-   **Main Application (Admin User)**
    -   Home Page (with "Dashboards" tile)
    -   Fund Portal Page
        -   Dashboard Page
        -   Ticketing Page
        -   Program Details Page
        -   Proxy Application Page (Wrapper)
            -   Step 1: Proxy Contact Page (`ApplyProxyContactPage`)
            -   (Steps 2-4 use the same components as the standard Apply flow)
        -   Token Usage Page
            -   Token Usage Filter Modal

-   **Shared Components**
    -   AI Relief Assistant (Chatbot Widget)
    -   Loading Overlays
