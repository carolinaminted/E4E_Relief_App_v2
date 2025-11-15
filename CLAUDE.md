# CLAUDE.md - AI Assistant Guide for E4E Relief App v2

> **Last Updated:** 2025-11-15
> **Project:** E4E Relief Application System
> **Version:** 2.1 (Firebase)

This document provides comprehensive guidance for AI assistants (like Claude) working on this codebase. It explains the project structure, development workflows, key conventions, and best practices.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Architecture & Key Concepts](#architecture--key-concepts)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Component Patterns](#component-patterns)
- [Services Architecture](#services-architecture)
- [Type System](#type-system)
- [Firebase Integration](#firebase-integration)
- [AI Integration (Gemini)](#ai-integration-gemini)
- [Internationalization (i18n)](#internationalization-i18n)
- [Common Development Tasks](#common-development-tasks)
- [Important Files Reference](#important-files-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**E4E Relief App v2** is a disaster relief application system that helps users apply for emergency financial assistance from multiple relief funds. The application features:

- **Multi-fund Support**: Users can be eligible for multiple disaster relief funds
- **AI-Powered Decisioning**: Gemini AI evaluates eligibility and processes applications
- **Class Verification**: Multiple verification methods (Domain, Roster, SSO, Manual)
- **Proxy Applications**: Admin users can submit applications on behalf of applicants
- **Multi-language Support**: English and Spanish via i18next
- **Real-time Analytics**: Token usage tracking and cost monitoring
- **Interactive Chatbot**: AI-powered relief assistant

### Key User Roles

1. **Applicants** - Regular users applying for relief
2. **Admins** - Fund portal access, can review applications and submit proxy applications
3. **Case Workers** - Submit applications on behalf of users (proxy mode)

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.8.2 | Type safety and developer experience |
| **Vite** | 6.2.0 | Build tool and dev server |
| **Firebase** | 12.5.0 | Backend (Auth, Firestore, Storage) |
| **Google Gemini AI** | @google/genai 1.25.0 | AI features (eligibility, parsing, chatbot) |
| **i18next** | 23.11.5 | Internationalization framework |
| **TailwindCSS** | - | Styling (loaded via CDN) |

### Development Tools

- **Module System**: ES Modules (ESM)
- **Import Maps**: Used in index.html for CDN modules
- **Path Aliases**: `@/` maps to project root
- **Node.js**: Required for development

### No Testing Framework

⚠️ **Important**: This project currently has no testing framework configured. When adding tests:
- Consider Vitest (works seamlessly with Vite)
- Or React Testing Library + Jest
- Update package.json with test scripts

---

## Repository Structure

```
E4E_Relief_App_v2/
├── components/          # 54 React components (organized by feature/page)
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ApplyPage.tsx
│   ├── ProfilePage.tsx
│   ├── FormControls.tsx  # Reusable form components
│   └── ...
├── services/            # Backend service layer (9 files)
│   ├── firebase.ts      # Firebase initialization
│   ├── firebaseAuthClient.ts  # Auth wrapper
│   ├── firestoreRepo.ts # Data repository pattern
│   ├── geminiService.ts # AI service (eligibility, parsing, chatbot)
│   ├── tokenTracker.ts  # Token usage analytics
│   └── dataRepo.ts      # Data access abstraction
├── data/               # Static configuration and data
│   ├── appData.ts      # Event types, employment types
│   ├── fundData.ts     # Fund configurations
│   ├── countries.ts    # Country data
│   └── tokenData.ts    # Token analytics structures
├── utils/              # Utility functions
│   └── formatting.ts   # Date, currency, number formatting
├── i18n/               # Internationalization
│   ├── i18n.ts         # i18next configuration
│   └── locales/
│       ├── en.json     # English translations
│       └── es.json     # Spanish translations
├── App.tsx             # Main application component (32KB)
├── types.ts            # TypeScript type definitions (11KB)
├── index.tsx           # Application entry point
├── index.html          # HTML template with import maps
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
├── firestore.rules     # Firestore security rules
├── storage.rules       # Firebase Storage security rules
├── firestore.seed.json # Sample data for development
└── README.md           # Quick start guide
```

### Directory Organization

- **`/components`**: All React components (54 files, 8,672 lines)
  - Page components: `*Page.tsx` (e.g., HomePage, ApplyPage)
  - Reusable components: FormControls, Icons, Modals
  - Feature components: ChatbotWidget, AddressHelper

- **`/services`**: Backend abstraction layer
  - Separates business logic from UI
  - Provides testable, reusable functions
  - Handles all Firebase and AI interactions

- **`/data`**: Static configuration
  - No runtime logic
  - Typed constant exports
  - Fund configurations, event types, etc.

- **`/i18n`**: Translation files and i18next setup
  - JSON translation files per language
  - Nested keys for organization

---

## Architecture & Key Concepts

### Application Flow

```
index.html (CDN imports)
    ↓
index.tsx (React root + i18n init + Suspense)
    ↓
App.tsx (Main orchestrator)
    ↓ (renders based on state)
[Page Components]
```

### State Management

**Local React State** (no Redux/Zustand):
- `App.tsx` manages global state (user, profile, active identity)
- Props drilling for component communication
- Firebase real-time listeners (`onSnapshot`) for reactive updates

### Navigation Pattern

**Type-safe page routing** via centralized `Page` type:

```typescript
// types.ts
export type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | ...

// App.tsx
const [currentPage, setCurrentPage] = useState<Page>('login');
```

No router library (React Router, etc.) - simple state-based navigation.

### Multi-Identity System

Users can have **multiple fund identities**:

```typescript
// A user has one profile but multiple identities
UserProfile {
  uid: string,
  activeIdentityId: string,  // Currently selected identity
  fundCode: string,          // Denormalized from active identity
  ...
}

// Each identity is a separate Firestore document
FundIdentity {
  id: string,                // Composite: uid-fundCode
  uid: string,
  fundCode: string,
  eligibilityStatus: 'Eligible' | 'Not Eligible',
  classVerificationStatus: 'unknown' | 'pending' | 'passed' | 'failed',
  ...
}
```

### Repository Pattern

Service layer follows **repository pattern**:

```typescript
// services/dataRepo.ts - Abstract interface
export interface UserProfileRepository {
  getUserProfile(uid: string): Promise<UserProfile | null>;
  updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>;
}

// services/firestoreRepo.ts - Firestore implementation
export class FirestoreUserProfileRepository implements UserProfileRepository {
  async getUserProfile(uid: string) { /* ... */ }
}
```

---

## Development Workflow

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Create .env.local file:
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 3. Start development server
npm run dev
```

### Development Server

- **URL**: http://localhost:3000
- **Host**: 0.0.0.0 (accessible from network)
- **Hot Reload**: Enabled via Vite HMR

### Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

**Deployment Target**: Firebase Hosting (inferred from Firebase integration)

### Git Workflow

**Branch Strategy**:
- Main branch development
- Feature branches prefixed with `claude/` for AI-assisted work
- Conventional commits style (see recent commits)

**Commit Message Pattern**:
```
<type>(<scope>): <description>

Examples:
feat: Add consent and acknowledgement translations
fix(proxyPage): Add missing activeFund prop
refactor: Improve user experience with reusable components
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`

---

## Code Conventions

### TypeScript Guidelines

1. **Strict Typing**: All components and functions should have explicit types
2. **No `any`**: Use proper types or `unknown` if needed
3. **Import types**: Use `import type` for type-only imports
4. **Type Location**: All shared types in `types.ts`

```typescript
// ✅ Good
import type { UserProfile, Address } from '../types';
const user: UserProfile = { ... };

// ❌ Bad
import { UserProfile } from '../types';  // Not using 'import type'
const user: any = { ... };               // Using 'any'
```

### Component Structure

**Functional Components with TypeScript**:

```typescript
import React from 'react';
import type { ComponentSpecificType } from '../types';

interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction: (value: string) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### File Naming

- **Components**: PascalCase (e.g., `ApplyPage.tsx`, `FormControls.tsx`)
- **Services**: camelCase (e.g., `geminiService.ts`, `tokenTracker.ts`)
- **Types**: camelCase (e.g., `types.ts`)
- **Data**: camelCase (e.g., `fundData.ts`)

### Import Order

```typescript
// 1. External dependencies
import React from 'react';
import { collection, getDocs } from 'firebase/firestore';

// 2. Type imports
import type { UserProfile, Application } from '../types';

// 3. Services
import { getUserProfile } from '../services/firestoreRepo';

// 4. Components
import FormInput from './FormControls';

// 5. Data/Utils
import { formatCurrency } from '../utils/formatting';
```

---

## Component Patterns

### Reusable Form Components

Located in `components/FormControls.tsx`:

```typescript
// Text input with label and validation
<FormInput
  label="First Name"
  id="firstName"
  required
  value={profile.firstName}
  onChange={e => updateProfile('firstName', e.target.value)}
  error={errors.firstName}
/>

// Radio group
<FormRadioGroup
  legend="Are you a homeowner?"
  name="homeowner"
  options={['Yes', 'No']}
  value={profile.homeowner}
  onChange={value => updateProfile('homeowner', value)}
  required
/>

// Address fields (compound component)
<AddressFields
  address={profile.primaryAddress}
  onUpdate={(field, value) => updateAddress('primary', field, value)}
  onBulkUpdate={parsedAddress => bulkUpdateAddress('primary', parsedAddress)}
  prefix="primary"
  errors={addressErrors}
/>
```

### Modal Pattern

```typescript
// Modals use conditional rendering
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
      {/* Modal content */}
    </div>
  </div>
)}
```

### Page Component Pattern

```typescript
interface PageProps {
  profile: UserProfile;
  activeFund: Fund;
  onNavigate: (page: Page) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const MyPage: React.FC<PageProps> = ({ profile, activeFund, onNavigate, onUpdateProfile }) => {
  // Page-specific state
  const [loading, setLoading] = useState(false);

  // Event handlers
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onUpdateProfile({ /* ... */ });
      onNavigate('nextPage');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Page content */}
    </div>
  );
};
```

---

## Services Architecture

### Firebase Service (`services/firebase.ts`)

Central Firebase initialization:

```typescript
import { auth, db, storage } from './services/firebase';

// Use these exported instances throughout the app
// DO NOT re-initialize Firebase elsewhere
```

### Authentication (`services/firebaseAuthClient.ts`)

Wrapper around Firebase Auth:

```typescript
import { login, logout, register, resetPassword } from './services/firebaseAuthClient';

// All auth operations go through this service
```

### Firestore Repository (`services/firestoreRepo.ts`)

Data access layer for all Firestore operations:

```typescript
// User profiles
await getUserProfile(uid);
await updateUserProfile(uid, updates);

// Fund identities
await getUserIdentities(uid);
await createFundIdentity(identity);

// Applications
await getApplications(uid, fundCode);
await createApplication(application);
```

### Gemini AI Service (`services/geminiService.ts`)

AI-powered features (37KB file):

```typescript
// Eligibility evaluation
const decision = await getAIDecision(application, profile, fund);

// Application parsing from text
const parsedData = await parseApplicationText(text, fund);

// Address parsing
const address = await parseAddress(addressText);

// Chatbot
const response = await sendChatMessage(messages, profile, fund);
```

**Important**: All Gemini calls are tracked for token usage analytics.

### Token Tracker (`services/tokenTracker.ts`)

Logs AI usage for cost monitoring:

```typescript
await logTokenEvent({
  uid: user.uid,
  userId: user.email,
  feature: 'AI Assistant',
  model: 'gemini-2.5-flash',
  inputTokens: 1234,
  outputTokens: 567,
  // ...
});
```

---

## Type System

### Core Types (`types.ts`)

**11KB file** with comprehensive type definitions:

#### User & Identity

```typescript
UserProfile          // Main user profile data
FundIdentity         // User's relationship with a fund
ActiveIdentity       // Currently selected fund identity
Address              // Physical address structure
```

#### Application Flow

```typescript
Application          // Submitted application record
ApplicationFormData  // Form state during submission
EventData            // Disaster event details
Expense              // Individual expense item
EligibilityDecision  // AI decision output
```

#### Status Types

```typescript
ClassVerificationStatus: 'unknown' | 'pending' | 'passed' | 'failed'
EligibilityStatus: 'Eligible' | 'Not Eligible'
```

#### Navigation

```typescript
Page: 'login' | 'register' | 'home' | 'apply' | ...  // All app pages
```

#### Analytics

```typescript
TokenEvent           // AI usage event
TokenUsageTableRow   // Aggregated usage data
ModelPricing         // Cost per 1000 tokens
```

### Type Guidelines

1. **Exhaustive Types**: Use union types instead of enums for status values
2. **Optional Fields**: Use `?` for optional, `| ''` for empty form fields
3. **ISO Dates**: All dates as `string` in ISO 8601 format
4. **Documentation**: JSDoc comments for complex types (see types.ts)

---

## Firebase Integration

### Project Configuration

- **Project ID**: `e4e-relief-app`
- **Region**: Default (us-central1)
- **Auth Domain**: `e4e-relief-app.firebaseapp.com`

### Firestore Collections

```
users/
  {uid}/
    - UserProfile data (denormalized with active identity)

identities/
  {uid-fundCode}/
    - FundIdentity documents
    - One per user per fund

applications/
  {applicationId}/
    - Application submissions
    - Indexed by uid, fundCode

tokenEvents/
  {eventId}/
    - AI usage logs
    - Indexed by uid, timestamp, feature
```

### Security Rules

- **firestore.rules**: Database access control
- **storage.rules**: File upload permissions

### Custom Claims

Admin role managed via Firebase Auth custom claims:

```typescript
// Set via Firebase Admin SDK
await admin.auth().setCustomUserClaims(uid, { role: 'Admin' });

// Read in client
const tokenResult = await user.getIdTokenResult();
const role = tokenResult.claims.role;  // 'Admin' or undefined
```

**SOP**: See `SOP: Give Fund Portal Access.md` for admin access procedure.

---

## AI Integration (Gemini)

### Environment Setup

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key
```

**Vite config** injects this as `process.env.GEMINI_API_KEY`.

### Models Used

1. **gemini-2.5-flash**: Fast, cost-effective (chatbot, parsing)
2. **gemini-2.5-pro**: Higher quality (eligibility decisions)

### Key Features

#### 1. Eligibility Evaluation

```typescript
const decision = await getAIDecision(application, profile, fund);
// Returns: EligibilityDecision with decision, reasons, award amount
```

#### 2. Application Parsing

Pre-fill application from text:

```typescript
const formData = await parseApplicationText(userText, fund);
// Returns: Partial<ApplicationFormData>
```

#### 3. Address Helper

Parse address from free text:

```typescript
const address = await parseAddress("123 Main St, Anytown CA 12345");
// Returns: Partial<Address>
```

#### 4. Relief Assistant Chatbot

Interactive help:

```typescript
const response = await sendChatMessage(conversationHistory, profile, fund);
// Returns: { response: string, tokens: {...} }
```

### Token Usage Tracking

**All AI calls must log tokens**:

```typescript
// In geminiService.ts
const result = await model.generateContent(prompt);
const usage = result.response.usageMetadata;

await logTokenEvent({
  sessionId: currentSessionId,
  feature: 'AI Assistant',
  model: 'gemini-2.5-flash',
  inputTokens: usage.promptTokenCount,
  cachedInputTokens: usage.cachedContentTokenCount || 0,
  outputTokens: usage.candidatesTokenCount,
  // ...
});
```

---

## Internationalization (i18n)

### Setup

**i18next** with HTTP backend for dynamic loading:

```typescript
// i18n/i18n.ts
i18next
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    backend: {
      loadPath: '/i18n/locales/{{lng}}.json',
    },
  });
```

### Translation Files

```
i18n/locales/
  en.json  # English (source)
  es.json  # Spanish
```

**Structure**: Nested keys by feature/page

```json
{
  "login": {
    "title": "Sign In",
    "email": "Email",
    "password": "Password"
  },
  "apply": {
    "title": "Apply for Relief",
    "steps": {
      "contact": "Contact Information"
    }
  }
}
```

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
    </div>
  );
};
```

### Language Switcher

`components/LanguageSwitcher.tsx` provides UI toggle.

### Adding New Translations

1. Add keys to `i18n/locales/en.json`
2. Translate to `i18n/locales/es.json`
3. Use `t('key.path')` in components

---

## Common Development Tasks

### 1. Adding a New Page

```typescript
// Step 1: Add page to Page type in types.ts
export type Page = '...' | 'myNewPage';

// Step 2: Create component in components/MyNewPage.tsx
const MyNewPage: React.FC<PageProps> = ({ profile, onNavigate }) => {
  return <div>{/* content */}</div>;
};

// Step 3: Add route in App.tsx
{currentPage === 'myNewPage' && (
  <MyNewPage
    profile={profile}
    onNavigate={setCurrentPage}
  />
)}

// Step 4: Add navigation from other pages
<button onClick={() => onNavigate('myNewPage')}>
  Go to New Page
</button>
```

### 2. Adding a New Form Field

```typescript
// Step 1: Add to UserProfile type in types.ts
export interface UserProfile {
  // ... existing fields
  newField: string;
}

// Step 2: Update Firestore document (migration may be needed)
// Consider default values for existing users

// Step 3: Add form input in component
<FormInput
  label="New Field"
  id="newField"
  value={profile.newField}
  onChange={e => updateProfile('newField', e.target.value)}
/>
```

### 3. Adding a New AI Feature

```typescript
// Step 1: Create function in services/geminiService.ts
export async function myNewAIFeature(input: string): Promise<Result> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent(prompt);

  // Step 2: Log tokens
  await logTokenEvent({
    feature: 'My New Feature',
    // ... token counts
  });

  return parsedResult;
}
```

### 4. Adding Translation Keys

```json
// i18n/locales/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my new feature"
  }
}

// i18n/locales/es.json
{
  "myFeature": {
    "title": "Mi Función",
    "description": "Esta es mi nueva función"
  }
}
```

### 5. Creating a New Service

```typescript
// services/myService.ts
import { db } from './firebase';
import type { MyType } from '../types';

export async function myServiceFunction(input: string): Promise<MyType> {
  // Implementation
}

// Export all functions
export { myServiceFunction };
```

---

## Important Files Reference

### Entry Points

- **`index.html`**: HTML template, import maps, TailwindCSS CDN
- **`index.tsx`**: React root, i18n initialization, Suspense wrapper
- **`App.tsx`**: Main application logic (32KB)

### Configuration

- **`vite.config.ts`**: Build configuration, env vars, path aliases
- **`tsconfig.json`**: TypeScript compiler options
- **`package.json`**: Dependencies and scripts
- **`.env.local`**: Environment variables (create this, not in git)

### Core Logic

- **`types.ts`**: All TypeScript types (11KB)
- **`services/firebase.ts`**: Firebase initialization
- **`services/geminiService.ts`**: AI features (37KB)
- **`services/firestoreRepo.ts`**: Data layer

### Data

- **`data/fundData.ts`**: Fund configurations
- **`data/appData.ts`**: Event types, employment types
- **`firestore.seed.json`**: Sample development data

### Documentation

- **`README.md`**: Quick start guide
- **`readme.md`**: Business overview
- **`user_guide.md`**: End-user documentation
- **`firebase-conversion-guide.md`**: Migration documentation
- **`SOP: Give Fund Portal Access.md`**: Admin access procedure

---

## Best Practices

### Code Quality

1. **Type Safety**: Never use `any`, always define proper types
2. **Error Handling**: Always wrap async operations in try-catch
3. **Loading States**: Show loading indicators for async operations
4. **Form Validation**: Validate before submission, show clear errors

### React Patterns

1. **Functional Components**: Use function components, not class components
2. **Hooks**: Use built-in hooks appropriately (useState, useEffect, etc.)
3. **Props Drilling**: Acceptable for this size app (no context needed yet)
4. **Key Props**: Always provide stable keys for lists

### Firebase Best Practices

1. **Security First**: Never expose sensitive data in client code
2. **Batch Writes**: Use batched writes for multiple updates
3. **Listeners**: Clean up onSnapshot listeners in useEffect cleanup
4. **Indexes**: Add indexes for common queries (see Firestore console)

### AI Usage

1. **Cost Awareness**: Choose appropriate model (flash vs pro)
2. **Token Logging**: Always log token usage for analytics
3. **Error Handling**: Gracefully handle AI failures
4. **User Feedback**: Show clear messages when AI is processing

### Accessibility

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Labels**: Add labels for screen readers
3. **Keyboard Navigation**: Ensure all actions are keyboard-accessible
4. **Color Contrast**: Maintain WCAG AA standards (current colors approved)

### Performance

1. **Lazy Loading**: Use React.lazy for code splitting if needed
2. **Memoization**: Use useMemo/useCallback for expensive operations
3. **Firestore Queries**: Limit query results, use pagination
4. **Image Optimization**: Compress images before upload

---

## Troubleshooting

### Common Issues

#### Firebase Connection Issues

```typescript
// Check Firebase initialization
console.log('Firebase app:', app);
console.log('Auth:', auth);

// Verify environment in Firestore console
```

#### CORS Issues with Gemini

```typescript
// Ensure API key is set correctly
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

// Check Gemini API quota in Google Cloud Console
```

#### i18n Not Loading

```typescript
// Check if files are in public directory
// Vite serves public/ at root, so path should be /i18n/locales/en.json
```

#### Type Errors

```typescript
// Ensure types.ts is imported correctly
import type { UserProfile } from '../types';  // Use 'import type'

// Check tsconfig.json paths configuration
```

### Debug Mode

Enable verbose logging:

```typescript
// In App.tsx or component
const DEBUG = true;

if (DEBUG) {
  console.log('State:', { profile, currentPage, activeFund });
}
```

### Hot Reload Issues

```bash
# If Vite HMR stops working
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Restart dev server
npm run dev
```

---

## Working with AI Assistants (Claude)

### When Making Changes

1. **Read Existing Code First**: Always read relevant files before modifying
2. **Follow Existing Patterns**: Match the style and structure of existing code
3. **Update Types**: If adding fields, update `types.ts` first
4. **Test Thoroughly**: Manually test all changes in development mode
5. **Check i18n**: If user-facing text, add translation keys
6. **Document Changes**: Update this CLAUDE.md if you change architecture

### Preferred Approach

```typescript
// ✅ Good: Read existing, follow patterns
// 1. Read components/ProfilePage.tsx
// 2. Create similar structure for new page
// 3. Use same prop patterns
// 4. Import types correctly

// ❌ Bad: Create from scratch without context
// - Different prop patterns
// - Inconsistent styling
// - Missing type safety
```

### Git Workflow

```bash
# When making commits
git add .
git commit -m "feat(scope): description"
git push -u origin claude/branch-name
```

### Communication

When reporting changes:
1. List files modified/created
2. Explain architectural decisions
3. Note any breaking changes
4. Suggest testing steps

---

## Conclusion

This document should be updated as the project evolves. Key architectural changes, new patterns, or significant refactors should be reflected here to maintain its usefulness for AI assistants and human developers.

**Questions or Improvements?** Update this document and commit changes with clear descriptions.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Maintained By**: Development Team + AI Assistants
