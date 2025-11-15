# E4E Relief App v2 - Dataverse Migration Plan
## ACCELERATED IMPLEMENTATION (12 Hours to Production)

> **Last Updated**: 2025-11-15
> **Strategy**: Progressive enhancement with parallel workstreams
> **Goal**: Working demo in 6 hours, production-ready in 12 hours

---

## 📊 EXECUTIVE SUMMARY

### What We're Doing
Converting the existing Firebase-based React app to use **Azure AD B2C + Dataverse** while maintaining 100% feature parity.

### Why It's Fast
- ✅ Backend infrastructure already exists (Power Pages proves it works)
- ✅ React architecture already proven (current Firebase app)
- ✅ User registration handled by existing Function App
- ✅ Security roles and permissions configured
- ✅ No data migration needed (React queries existing data)

### Timeline
- **Phase 0**: Pre-flight validation (30 min) ⏱️ **START NOW**
- **Phase 1**: Auth integration (2 hours)
- **Phase 2**: Profile feature (4 hours)
- **Phase 3**: Grants feature (4 hours)
- **Phase 4**: Deploy & polish (2 hours)

**Total**: 12.5 hours from start to production deployment

---

## 🎯 ARCHITECTURE OVERVIEW

### Current State (Firebase)
```
User → Firebase Auth → Firestore → React UI
                ↓
        Gemini AI (eligibility)
```

### Target State (Dataverse)
```
User → AD B2C → Dataverse Web API → React UI
                      ↓
              (Gemini AI remains)
```

### Key Insight
**The React UI stays 95% the same.** We're only swapping the data layer.

```typescript
// BEFORE (Firebase)
import { getUserProfile } from './services/firestoreRepo';

// AFTER (Dataverse)
import { getUserProfile } from './services/dataverseRepo';
```

---

## 🚀 PHASE 0: PRE-FLIGHT VALIDATION (30 Minutes)
### Do This BEFORE Writing Code

### Task 0.1: Gather Configuration Values (15 min)

**Create `.env.dataverse` file** with these values:

```bash
# AD B2C Configuration
VITE_B2C_CLIENT_ID=
VITE_B2C_TENANT_NAME=
VITE_B2C_POLICY_NAME=
VITE_B2C_AUTHORITY=

# Dataverse Configuration
VITE_DATAVERSE_URL=
VITE_DATAVERSE_API_VERSION=v9.2

# Keep existing
GEMINI_API_KEY=your_existing_key
```

**How to find these**:

1. **B2C Client ID**: Azure Portal → Azure AD B2C → App registrations → [Your App] → Application (client) ID
2. **Tenant Name**: Your B2C tenant (e.g., `yourorg.onmicrosoft.com`)
3. **Policy Name**: User flows section (e.g., `B2C_1_SignUpSignIn`)
4. **Dataverse URL**: Power Platform Admin Center → Environments → [Your Env] → Environment URL

### Task 0.2: Test Existing B2C Login (5 min)

**Verify your current B2C works**:

1. Open Power Pages site
2. Click "Login"
3. After login, open DevTools → Application → Session Storage
4. Find token, paste into https://jwt.io
5. **Screenshot the claims** - we need to see exact claim names

Expected claims:
```json
{
  "emailaddress1": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "e4e_fundid": "guid-here",
  ...
}
```

### Task 0.3: Verify Dataverse Access (10 min)

**Test API access** from browser console on Power Pages:

```javascript
// Copy your access token from Session Storage
const token = "eyJ0eXAiOiJKV1QiLCJhbGc...";

fetch('https://yourorg.crm.dynamics.com/api/data/v9.2/contacts?$top=1', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

**Success**: See contact data
**CORS Error**: We'll fix in Phase 1
**401 Error**: Token might be expired, try fresh login

---

## 🔐 PHASE 1: AUTHENTICATION (2 Hours)
### Goal: Users can login with B2C and see their name

### Step 1.1: Install MSAL Library (5 min)

```bash
cd E4E_Relief_App_v2
npm install @azure/msal-browser @azure/msal-react
```

### Step 1.2: Create B2C Configuration (10 min)

**File**: `services/azureB2CConfig.ts`

```typescript
import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID,
    authority: import.meta.env.VITE_B2C_AUTHORITY,
    knownAuthorities: [`${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log('[MSAL]', message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: [
    `${import.meta.env.VITE_DATAVERSE_URL}/.default`
  ],
};
```

### Step 1.3: Adapt Firebase Auth Service (30 min)

**Strategy**: Keep the SAME interface, swap implementation

**File**: `services/b2cAuthClient.ts`

```typescript
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './azureB2CConfig';

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize
await msalInstance.initialize();

// Keep same function signatures as firebaseAuthClient.ts
export async function login(): Promise<void> {
  try {
    await msalInstance.loginPopup(loginRequest);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  const account = msalInstance.getAllAccounts()[0];
  if (account) {
    await msalInstance.logoutPopup({ account });
  }
}

export function getCurrentUser(): AccountInfo | null {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function getAccessToken(): Promise<string> {
  const account = getCurrentUser();
  if (!account) throw new Error('No user logged in');

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    // Fallback to popup
    const response = await msalInstance.acquireTokenPopup(loginRequest);
    return response.accessToken;
  }
}

// Parse claims from ID token
export function getUserClaims(): Record<string, any> {
  const account = getCurrentUser();
  return account?.idTokenClaims || {};
}
```

### Step 1.4: Update App.tsx to Use B2C (15 min)

**File**: `App.tsx` (minimal changes)

```typescript
// BEFORE
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// AFTER
import { getCurrentUser, getUserClaims } from './services/b2cAuthClient';

// Replace Firebase auth listener
useEffect(() => {
  // BEFORE
  // const unsubscribe = onAuthStateChanged(auth, (user) => { ... });

  // AFTER
  const user = getCurrentUser();
  if (user) {
    const claims = getUserClaims();
    setUser({
      uid: user.localAccountId,
      email: claims.emailaddress1 || user.username,
      displayName: `${claims.firstname} ${claims.lastname}`,
    });
  }
}, []);
```

### Step 1.5: Test Auth Flow (15 min)

```bash
npm run dev
```

**Test**:
1. Click "Login" → Should redirect to B2C
2. Login with test account
3. Check browser console:
   ```javascript
   const claims = getUserClaims();
   console.log(claims);
   ```
4. Verify claims present: `emailaddress1`, `firstname`, `e4e_fundid`

**✅ Success Criteria**: Can login, see user name in header

### Step 1.6: Handle CORS Issues (30 min IF NEEDED)

**If you get CORS errors** when calling Dataverse API:

#### Option A: Configure Dataverse CORS (Preferred)

Power Platform Admin Center → Environments → [Your Env] → Settings → Resources → Web API → CORS

Add origins:
- `http://localhost:3000` (dev)
- `https://e4erelief.org` (prod)

#### Option B: Azure Function Proxy (If CORS Can't Be Changed)

Create a simple Azure Function as API proxy:

```typescript
// function: dataverse-proxy
export default async function (context, req) {
  const token = req.headers.authorization;
  const path = req.params.path;

  const response = await fetch(
    `${process.env.DATAVERSE_URL}/api/data/v9.2/${path}`,
    {
      method: req.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    }
  );

  context.res = {
    status: response.status,
    body: await response.json(),
  };
}
```

Then point React to proxy instead of direct Dataverse URL.

---

## 👤 PHASE 2: PROFILE FEATURE (4 Hours)
### Goal: View and edit user profile (Contact record)

### Step 2.1: Create Dataverse API Client (30 min)

**File**: `services/dataverseClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from './b2cAuthClient';

class DataverseClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${import.meta.env.VITE_DATAVERSE_URL}/api/data/${import.meta.env.VITE_DATAVERSE_API_VERSION}`,
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Intercept requests to add auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async patch<T>(url: string, data: any): Promise<T> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete(url: string): Promise<void> {
    await this.client.delete(url);
  }
}

export const dataverseClient = new DataverseClient();
```

### Step 2.2: Create Dataverse Repository (45 min)

**File**: `services/dataverseRepo.ts`

**Strategy**: Mimic `firestoreRepo.ts` structure exactly

```typescript
import { dataverseClient } from './dataverseClient';
import type { UserProfile, Address } from '../types';
import { getUserClaims } from './b2cAuthClient';

// === USER PROFILE ===

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const claims = getUserClaims();
  const email = claims.emailaddress1;

  // Query Contact by email (linked via adx_identity_username)
  const response = await dataverseClient.get<{ value: any[] }>('/contacts', {
    $filter: `emailaddress1 eq '${email}'`,
    $select: 'contactid,firstname,lastname,middlename,emailaddress1,telephone1,address1_line1,address1_line2,address1_city,address1_stateorprovince,address1_postalcode,address1_country',
    $expand: 'e4e_fundid($select=e4e_fundid,e4e_name)',
  });

  if (response.value.length === 0) {
    return null;
  }

  const contact = response.value[0];

  // Map Dataverse Contact → UserProfile type
  return {
    uid: contact.contactid,
    identityId: contact.emailaddress1,
    activeIdentityId: contact.contactid, // Simplified for now
    firstName: contact.firstname || '',
    lastName: contact.lastname || '',
    middleName: contact.middlename || '',
    suffix: '',
    email: contact.emailaddress1,
    mobileNumber: contact.telephone1 || '',
    primaryAddress: {
      country: contact.address1_country || '',
      street1: contact.address1_line1 || '',
      street2: contact.address1_line2 || '',
      city: contact.address1_city || '',
      state: contact.address1_stateorprovince || '',
      zip: contact.address1_postalcode || '',
    },
    mailingAddress: undefined, // TODO: Map address2_* fields if needed
    employmentStartDate: '', // TODO: Map custom field
    eligibilityType: '', // TODO: Map from fund
    householdIncome: '',
    householdSize: '',
    homeowner: '',
    preferredLanguage: claims.extension_PreferredLanguage || 'en',
    isMailingAddressSame: null,
    ackPolicies: false,
    commConsent: false,
    infoCorrect: false,
    fundCode: contact.e4e_fundid?.e4e_fundid || '',
    fundName: contact.e4e_fundid?.e4e_name || '',
    classVerificationStatus: 'passed', // Since they logged in via B2C
    eligibilityStatus: 'Eligible', // TODO: Get from identity record
    role: 'User', // TODO: Read from B2C groups claim
    tokensUsedTotal: 0,
    estimatedCostTotal: 0,
  };
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const claims = getUserClaims();
  const email = claims.emailaddress1;

  // Get contactid
  const response = await dataverseClient.get<{ value: any[] }>('/contacts', {
    $filter: `emailaddress1 eq '${email}'`,
    $select: 'contactid',
  });

  if (response.value.length === 0) {
    throw new Error('Contact not found');
  }

  const contactId = response.value[0].contactid;

  // Map UserProfile updates → Dataverse Contact fields
  const dataverseUpdates: any = {};

  if (updates.firstName) dataverseUpdates.firstname = updates.firstName;
  if (updates.lastName) dataverseUpdates.lastname = updates.lastName;
  if (updates.middleName) dataverseUpdates.middlename = updates.middleName;
  if (updates.mobileNumber) dataverseUpdates.telephone1 = updates.mobileNumber;

  // Address updates
  if (updates.primaryAddress) {
    const addr = updates.primaryAddress;
    if (addr.street1) dataverseUpdates.address1_line1 = addr.street1;
    if (addr.street2) dataverseUpdates.address1_line2 = addr.street2;
    if (addr.city) dataverseUpdates.address1_city = addr.city;
    if (addr.state) dataverseUpdates.address1_stateorprovince = addr.state;
    if (addr.zip) dataverseUpdates.address1_postalcode = addr.zip;
    if (addr.country) dataverseUpdates.address1_country = addr.country;
  }

  await dataverseClient.patch(`/contacts(${contactId})`, dataverseUpdates);
}

// === FUND IDENTITIES ===

export async function getUserIdentities(uid: string): Promise<any[]> {
  // TODO: If you have separate identity records in Dataverse
  // For now, return single identity from Contact
  const profile = await getUserProfile(uid);
  if (!profile) return [];

  return [
    {
      id: profile.activeIdentityId,
      uid: profile.uid,
      fundCode: profile.fundCode,
      fundName: profile.fundName,
      cvType: 'SSO', // B2C login
      eligibilityStatus: profile.eligibilityStatus,
      classVerificationStatus: profile.classVerificationStatus,
      createdAt: new Date().toISOString(),
    },
  ];
}
```

### Step 2.3: Update Profile Page (30 min)

**File**: `components/ProfilePage.tsx`

**NO CHANGES NEEDED!** (If you used repository pattern correctly)

The page should already call:
```typescript
import { getUserProfile, updateUserProfile } from '../services/firestoreRepo';
```

Just update the import:
```typescript
import { getUserProfile, updateUserProfile } from '../services/dataverseRepo';
```

### Step 2.4: Test Profile Feature (15 min)

```bash
npm run dev
```

**Test**:
1. Login
2. Navigate to Profile page
3. Should see your name, email, phone (from Dataverse Contact)
4. Edit first name
5. Save
6. Refresh page → verify change persisted
7. Check Power Pages → verify change visible there too

**✅ Success Criteria**: Profile reads and writes sync with Dataverse

### Step 2.5: Add Loading States & Error Handling (30 min)

Update `ProfilePage.tsx`:

```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getUserProfile(user.uid);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  loadProfile();
}, [user.uid]);

if (loading) return <LoadingOverlay message="Loading profile..." />;
if (error) return <div className="error">{error}</div>;
if (!profile) return <div>Profile not found</div>;
```

---

## 📝 PHASE 3: GRANT APPLICATIONS (4 Hours)
### Goal: List and create grant applications

### Step 3.1: Add Grant Methods to Repository (1 hour)

**File**: `services/dataverseRepo.ts` (add to existing file)

```typescript
import type { Application } from '../types';

// === GRANT APPLICATIONS ===

export async function getApplications(
  uid: string,
  fundCode?: string
): Promise<Application[]> {
  const claims = getUserClaims();
  const email = claims.emailaddress1;

  // First get contactid
  const contactResponse = await dataverseClient.get<{ value: any[] }>(
    '/contacts',
    {
      $filter: `emailaddress1 eq '${email}'`,
      $select: 'contactid',
    }
  );

  if (contactResponse.value.length === 0) {
    return [];
  }

  const contactId = contactResponse.value[0].contactid;

  // Query grant applications
  let filter = `_e4e_applicant_value eq ${contactId}`;
  if (fundCode) {
    // TODO: Add fund filter if you have fundCode on grant table
  }

  const response = await dataverseClient.get<{ value: any[] }>(
    '/e4e_grantapplications',
    {
      $filter: filter,
      $orderby: 'createdon desc',
      $select: 'e4e_grantapplicationid,e4e_status,e4e_requestedamount,e4e_awardedamount,createdon,modifiedon,e4e_needdescription',
      $expand: 'e4e_applicant($select=fullname,emailaddress1)',
    }
  );

  // Map Dataverse grants → Application type
  return response.value.map((grant) => ({
    id: grant.e4e_grantapplicationid,
    uid: contactId,
    // Event data (TODO: map your actual fields)
    event: '', // TODO: e4e_eventype?
    eventDate: '', // TODO: e4e_eventdate?
    evacuated: '',
    powerLoss: '',
    additionalDetails: grant.e4e_needdescription || '',
    requestedAmount: grant.e4e_requestedamount || 0,
    expenses: [], // TODO: Related expense records?

    // Metadata
    profileSnapshot: {} as any, // TODO: Get from related contact
    submittedDate: grant.createdon,
    status: mapGrantStatus(grant.e4e_status),
    reasons: [],
    decisionedDate: grant.modifiedon,
    twelveMonthGrantRemaining: 0, // TODO: Calculate
    lifetimeGrantRemaining: 0, // TODO: Calculate
    shareStory: false,
    receiveAdditionalInfo: false,
    submittedBy: contactId,
    isProxy: false,
  }));
}

function mapGrantStatus(dataverseStatus: number): Application['status'] {
  // TODO: Map your actual status choice values
  // For now, default mapping:
  switch (dataverseStatus) {
    case 100000000: // "Received - In Progress"
      return 'Submitted';
    case 100000005: // "Grant Awarded - Closed"
      return 'Awarded';
    case 100000006: // "Grant Declined - Closed"
      return 'Declined';
    default:
      return 'Submitted';
  }
}

export async function createApplication(
  application: Partial<Application>
): Promise<string> {
  const claims = getUserClaims();
  const email = claims.emailaddress1;

  // Get contactid
  const contactResponse = await dataverseClient.get<{ value: any[] }>(
    '/contacts',
    {
      $filter: `emailaddress1 eq '${email}'`,
      $select: 'contactid,e4e_fundid',
    }
  );

  if (contactResponse.value.length === 0) {
    throw new Error('Contact not found');
  }

  const contact = contactResponse.value[0];

  // Create grant application
  const grantData = {
    // Link to applicant (Contact)
    'e4e_applicant@odata.bind': `/contacts(${contact.contactid})`,

    // Link to fund
    'e4e_fund@odata.bind': `/e4e_funds(${contact.e4e_fundid})`,

    // Application fields
    e4e_requestedamount: application.requestedAmount,
    e4e_needdescription: application.additionalDetails,

    // TODO: Map other fields from your grant table
    // e4e_eventtype: application.event,
    // e4e_eventdate: application.eventDate,

    // Set initial status
    e4e_status: 100000000, // "Received - In Progress" (verify this value!)
  };

  const response = await dataverseClient.post<{ e4e_grantapplicationid: string }>(
    '/e4e_grantapplications',
    grantData
  );

  return response.e4e_grantapplicationid;
}
```

### Step 3.2: Update My Applications Page (30 min)

**File**: `components/MyApplicationsPage.tsx`

Again, if using repository pattern, just update import:

```typescript
import { getApplications } from '../services/dataverseRepo';
```

### Step 3.3: Update Apply Flow (1 hour)

**Files to update**:
- `components/ApplyPage.tsx`
- `components/ApplyEventPage.tsx`
- `components/ApplyExpensesPage.tsx`

**Changes**:
1. Update `createApplication` import
2. Remove any Firebase-specific code
3. Test submission flow

### Step 3.4: Test Grant Feature (30 min)

**Test**:
1. Login
2. Navigate to "My Applications"
3. Should see existing grants from Dataverse
4. Click "Apply for Relief"
5. Fill out application form
6. Submit
7. Should see new grant in list
8. Check Power Pages → verify grant appears there

**✅ Success Criteria**: Can create and view grants

### Step 3.5: Keep Gemini AI Integration (1 hour)

**Good news**: Gemini service doesn't need changes!

**File**: `services/geminiService.ts` - NO CHANGES

The AI features (eligibility, parsing, chatbot) work the same way:
- Input: Application data (regardless of source)
- Output: EligibilityDecision
- Token tracking: Still logs to... wait, where?

**TODO: Token Tracking Decision**

Option A: Keep logging to Firebase (easiest)
```typescript
// Keep using firestore for token events
import { logTokenEvent } from './tokenTracker'; // No changes
```

Option B: Log to Dataverse custom table
```typescript
// Create e4e_tokenusage table in Dataverse
// Update tokenTracker.ts to use dataverseClient
```

**Recommendation**: Option A for now (Phase 1). Migrate token tracking in Phase 2.

---

## 🚀 PHASE 4: DEPLOYMENT (2 Hours)
### Goal: App live on Azure

### Step 4.1: Choose Hosting Option (Decision Point)

**Option A: Azure Static Web Apps** (Recommended)

Pros:
- ✅ Dead simple deployment
- ✅ Built-in CI/CD from GitHub
- ✅ Free SSL
- ✅ Custom domain support
- ✅ Serverless API functions (for proxy if needed)

Cons:
- ❌ Less control than App Service

**Option B: Azure App Service**

Pros:
- ✅ More control
- ✅ Can run server-side code
- ✅ Scaling options

Cons:
- ❌ More expensive
- ❌ More configuration

**Recommendation**: Start with Static Web Apps. Migrate to App Service only if you need server-side rendering.

### Step 4.2: Deploy to Azure Static Web Apps (30 min)

**Via Azure Portal**:

1. Azure Portal → Create Resource → "Static Web App"
2. Fill in:
   - Name: `e4e-relief-app`
   - Region: East US 2
   - Source: GitHub
   - Repo: `carolinaminted/E4E_Relief_App_v2`
   - Branch: `main` (or your production branch)
   - Build Presets: React
   - App location: `/`
   - Output location: `dist`

3. Click "Review + Create"

**What happens**:
- Azure creates GitHub Action workflow
- On every push to `main`, auto-builds and deploys
- App available at: `https://e4e-relief-app.azurestaticapps.net`

### Step 4.3: Configure Environment Variables (15 min)

Azure Portal → Your Static Web App → Configuration → Application settings

Add:
```
VITE_B2C_CLIENT_ID = [your value]
VITE_B2C_TENANT_NAME = [your value]
VITE_B2C_POLICY_NAME = [your value]
VITE_B2C_AUTHORITY = [your value]
VITE_DATAVERSE_URL = [your value]
VITE_DATAVERSE_API_VERSION = v9.2
GEMINI_API_KEY = [your value]
```

### Step 4.4: Update B2C Redirect URIs (10 min)

Azure Portal → Azure AD B2C → App Registrations → [Your App] → Authentication

Add redirect URIs:
- `https://e4e-relief-app.azurestaticapps.net`
- `https://e4erelief.org` (your custom domain)

### Step 4.5: Configure Custom Domain (30 min)

**In Azure Static Web App**:
1. Settings → Custom domains
2. Click "Add"
3. Enter: `e4erelief.org`
4. Follow DNS validation steps

**In your DNS provider**:
1. Add CNAME record:
   ```
   CNAME www.e4erelief.org → e4e-relief-app.azurestaticapps.net
   ```
2. Add TXT record for validation (Azure provides value)
3. Wait for validation (5-10 min)

**SSL**: Auto-provisioned by Azure (free)

### Step 4.6: Test Production Deployment (15 min)

**Test**:
1. Visit `https://e4erelief.org`
2. Click "Login" → Should redirect to B2C
3. Login with test account
4. Navigate to Profile → Should see data from Dataverse
5. Edit profile → Should save
6. Create test grant application → Should work

**✅ Success Criteria**: Production app fully functional

---

## 📋 CRITICAL INFORMATION NEEDED

### Before You Start, I Need:

#### 1. B2C Configuration
```
Client ID: ?
Tenant Name: ?
Policy Name: ?
Authority URL: ?
```

#### 2. Dataverse Configuration
```
Environment URL: ?
API Version: ? (probably v9.2)
```

#### 3. Grant Application Field Mappings

**What are the exact Dataverse column names for**:

| UserProfile Field | Dataverse Contact Column | ✓ |
|-------------------|-------------------------|---|
| `firstName` | `firstname` | ✅ |
| `lastName` | `lastname` | ✅ |
| `email` | `emailaddress1` | ✅ |
| `mobileNumber` | `telephone1` | ✅ |
| `primaryAddress.street1` | `address1_line1` | ✅ |
| `employmentStartDate` | ? | ❓ |
| `householdIncome` | ? | ❓ |
| `householdSize` | ? | ❓ |
| `homeowner` | ? | ❓ |

| Application Field | Dataverse Grant Column | ✓ |
|-------------------|------------------------|---|
| `event` | ? | ❓ |
| `eventDate` | ? | ❓ |
| `requestedAmount` | `e4e_requestedamount` | ✅ |
| `additionalDetails` | `e4e_needdescription` | ✅ |
| `evacuated` | ? | ❓ |
| `powerLoss` | ? | ❓ |

#### 4. Status Choice Values

**Run this in Dataverse**:

Power Platform → Tables → `e4e_grantapplication` → Columns → `e4e_status` → View choices

Tell me:
```
"Received - In Progress" = ?
"Qualification Required" = ?
"Additional Info Required" = ?
"Interview Required" = ?
"Grant Awarded - Closed" = ?
"Grant Declined - Closed" = ?
```

#### 5. Required Fields

**Which fields are required on grant application**?

Check Power Pages form, which have red asterisk (*)?

---

## 🎯 SUCCESS METRICS

### Phase 1 Complete When:
- ✅ User can login with B2C
- ✅ JWT contains expected claims
- ✅ No CORS errors calling Dataverse

### Phase 2 Complete When:
- ✅ Profile page loads data from Dataverse Contact
- ✅ Profile edits save to Contact
- ✅ Changes visible in both React app and Power Pages

### Phase 3 Complete When:
- ✅ "My Applications" shows grants from Dataverse
- ✅ New grant applications save to Dataverse
- ✅ Grants visible in both React app and Power Pages

### Phase 4 Complete When:
- ✅ App deployed to Azure
- ✅ Accessible via custom domain
- ✅ All features work in production

---

## 🚨 RISK MITIGATION

### Risk: CORS Issues
**Mitigation**: Have Azure Function proxy ready as backup

### Risk: Field Mapping Errors
**Mitigation**: Start with minimal fields, add incrementally

### Risk: Token Expiration
**Mitigation**: MSAL handles token refresh automatically

### Risk: Dataverse Permissions
**Mitigation**: Use same security roles as Power Pages

### Risk: Breaking Existing Firebase App
**Mitigation**: Keep Firebase code, add Dataverse in parallel
- Keep both `firestoreRepo.ts` and `dataverseRepo.ts`
- Use feature flag to toggle between backends:

```typescript
// services/repoFactory.ts
const USE_DATAVERSE = import.meta.env.VITE_USE_DATAVERSE === 'true';

export const getUserProfile = USE_DATAVERSE
  ? dataverseRepo.getUserProfile
  : firestoreRepo.getUserProfile;
```

---

## 📊 ESTIMATED TIMELINE

| Phase | Task | Hours | Cumulative |
|-------|------|-------|------------|
| 0 | Pre-flight validation | 0.5 | 0.5 |
| 1 | B2C auth integration | 2 | 2.5 |
| 2 | Profile feature (read/write) | 4 | 6.5 |
| 3 | Grant applications | 4 | 10.5 |
| 4 | Deploy to Azure | 2 | 12.5 |

**Total**: 12.5 hours (optimistic) to 16 hours (realistic with debugging)

**Calendar Time**:
- **1 developer, focused**: 2 days
- **Part-time (4 hrs/day)**: 3-4 days
- **With blockers/discovery**: 5 days

---

## 🔄 ROLLBACK PLAN

If Dataverse migration fails, we can instantly rollback:

```bash
# .env.local
VITE_USE_DATAVERSE=false  # Switch back to Firebase
```

**No code changes needed** if you use the factory pattern.

---

## 📖 NEXT STEPS

### Immediate (Today):
1. ✅ Gather configuration values (Phase 0)
2. ✅ Test existing B2C login
3. ✅ Verify Dataverse API access

### Tomorrow:
1. Implement Phase 1 (Auth)
2. Start Phase 2 (Profile)

### This Week:
1. Complete Phases 1-3 (working app)
2. Deploy Phase 4 (production)

### Next Week:
1. Migrate token tracking to Dataverse (optional)
2. Add advanced features
3. Performance optimization

---

## 🤝 SUPPORT & QUESTIONS

**If you get stuck**:

1. Check browser DevTools console for errors
2. Check Network tab for failed API calls
3. Verify token in jwt.io
4. Test same API call in Power Pages first
5. Ask me with:
   - Error message
   - Network request/response
   - Expected vs actual behavior

**I can provide**:
- Exact code for any component
- Dataverse query syntax
- MSAL configuration help
- Azure deployment support

---

**Let's start with Phase 0. Can you gather those configuration values?**

Once I have those, I can generate production-ready code for each phase.
