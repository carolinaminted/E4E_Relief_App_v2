# Dataverse Migration - Quick Start Checklist

> **Goal**: Get started in the next 30 minutes

---

## ✅ PRE-FLIGHT CHECKLIST (Do This Now)

### Step 1: Gather Configuration (15 min)

Copy this template and fill in your values:

```bash
# Save as .env.dataverse

# === Azure AD B2C ===
VITE_B2C_CLIENT_ID=________________________________________
VITE_B2C_TENANT_NAME=______________________.onmicrosoft.com
VITE_B2C_POLICY_NAME=B2C_1_SignUpSignIn
VITE_B2C_AUTHORITY=https://______________________.b2clogin.com/______________________.onmicrosoft.com/B2C_1_SignUpSignIn

# === Dataverse ===
VITE_DATAVERSE_URL=https://______________________.crm.dynamics.com
VITE_DATAVERSE_API_VERSION=v9.2

# === Existing ===
GEMINI_API_KEY=your_existing_key
```

**Where to find these values**:

#### B2C Configuration
1. Open Azure Portal: https://portal.azure.com
2. Search "Azure AD B2C"
3. Go to "App registrations"
4. Find your app (probably same name as Power Pages site)
5. Copy:
   - **Client ID** from Overview page
   - **Tenant name** from top-right dropdown
   - **Policy name** from "User flows" section

#### Dataverse URL
1. Open Power Platform Admin Center: https://admin.powerplatform.microsoft.com
2. Go to "Environments"
3. Click your environment
4. Copy the "Environment URL" (e.g., `https://orgname.crm.dynamics.com`)

---

### Step 2: Test B2C Token (10 min)

**Verify what claims you're getting**:

1. Open your Power Pages site
2. Click "Login"
3. After login, open DevTools (F12)
4. Go to: **Application** tab → **Session Storage**
5. Find key starting with `msal.`
6. Find the `idToken` field
7. Copy the token value (long string starting with `eyJ...`)
8. Go to https://jwt.io
9. Paste token in "Encoded" section
10. **Screenshot the "Payload" section** and send to me

**I need to see**:
- What the email claim is called (`emailaddress1`? `email`? `emails[0]`?)
- What the fund ID claim is called
- What other claims are present

---

### Step 3: Test Dataverse Access (5 min)

**Verify API is accessible**:

1. While still logged into Power Pages
2. Open DevTools Console tab
3. Paste this code (replace `YOUR_ORG` with your org name):

```javascript
// Get your token from session storage
const msalKey = Object.keys(sessionStorage).find(k => k.includes('msal'));
const msalData = JSON.parse(sessionStorage[msalKey]);
const token = msalData.secret; // Or similar path

// Test API call
fetch('https://YOUR_ORG.crm.dynamics.com/api/data/v9.2/contacts?$top=1', {
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

**Possible results**:

| Result | Meaning | Action |
|--------|---------|--------|
| ✅ See contact data | API works! | Continue to Step 4 |
| ❌ CORS error | CORS not configured | I'll provide fix in Phase 1 |
| ❌ 401 Unauthorized | Token issue | Try fresh login |
| ❌ 404 Not Found | Wrong URL | Verify Dataverse URL |

---

### Step 4: Field Mapping Discovery (Optional but helpful)

**Tell me what fields exist on your grant table**:

1. Open Power Platform: https://make.powerapps.com
2. Go to "Tables"
3. Find `e4e_grantapplication` (or similar name)
4. Click "Columns"
5. Take screenshot or copy list of column names

**Specifically looking for**:
- Event type field (e.g., `e4e_eventtype`)
- Event date field (e.g., `e4e_eventdate`)
- Requested amount (e.g., `e4e_requestedamount`)
- Status field (e.g., `e4e_status`)
- Applicant lookup (e.g., `e4e_applicant`)
- Fund lookup (e.g., `e4e_fund`)

---

## 🚀 READY TO CODE?

Once you complete the above, you're ready for Phase 1!

**You should have**:
- ✅ `.env.dataverse` file with all values
- ✅ Screenshot of JWT claims
- ✅ Confirmation that Dataverse API is accessible
- ✅ (Optional) List of grant table columns

**Next step**: I'll generate the exact code for Phase 1 (Auth integration)

---

## ⚡ ACCELERATED PATH (If you're in a hurry)

**Don't have time to gather everything?**

Start with **minimal config** and we'll fill in blanks as we go:

```bash
# Minimal .env.dataverse
VITE_B2C_CLIENT_ID=paste_from_azure
VITE_B2C_TENANT_NAME=yourorg.onmicrosoft.com
VITE_B2C_AUTHORITY=https://yourorg.b2clogin.com/yourorg.onmicrosoft.com/B2C_1_SignUpSignIn
VITE_DATAVERSE_URL=https://yourorg.crm.dynamics.com
VITE_DATAVERSE_API_VERSION=v9.2
```

**Then**:

```bash
cd E4E_Relief_App_v2
npm install @azure/msal-browser @azure/msal-react axios
npm run dev
```

**I'll provide code that**:
- Uses sensible defaults
- Has `TODO` comments where you need to fill in values
- Can be refined incrementally

**Risk**: May hit errors that require going back to gather info. But you'll have working code to test against.

---

## 📞 WHEN TO ASK FOR HELP

**Immediate blockers**:
- Can't find B2C app registration
- Don't have access to Azure Portal
- Don't know Dataverse URL
- CORS errors and can't configure Dataverse

**Expected issues** (I can help fix):
- Token doesn't have expected claims → We'll adjust claim mapping
- API returns 401 → We'll check scopes
- Field mapping unclear → We'll discover together

**Green flags** (you're on track):
- Can login to Power Pages ✅
- Can see data in Power Pages ✅
- Have admin access to Azure Portal ✅
- Have Power Platform access ✅

---

## 🎯 SUCCESS = 30 Minutes from Now

**You should have**:

1. ✅ Configuration file created
2. ✅ Understanding of your B2C setup
3. ✅ Verified Dataverse is accessible
4. ✅ Ready to start Phase 1 coding

**Then we code Phase 1 (Auth) together - estimated 2 hours to working login.**

---

**Ready? Start with Step 1 above! 🚀**
