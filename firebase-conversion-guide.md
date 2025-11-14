# E4E Relief App: Firebase Backend Migration Plan

## 1. Executive Summary

This document outlines a comprehensive plan to migrate the E4E Relief application's backend from the current in-memory mock implementation to a robust, scalable, and real-time backend powered by Google Firebase. This migration will enable persistent data, secure user management, and a foundation for future growth.

**Key Objectives:**
-   **Secure Authentication:** Replace the mock login with Firebase Authentication for secure user sign-up, sign-in, and session management.
-   **Persistent Data Storage:** Move all application data (user profiles, applications, identities, and fund configurations) to Firestore.
-   **Maintainable Architecture:** Implement a provider-agnostic client architecture using repository interfaces to decouple the UI from Firebase.
-   **Scalability & Reliability:** Utilize Google Cloud's infrastructure to ensure the application can scale with user growth.
-   **Enhanced Security:** Implement granular access control using Firestore Security Rules and Firebase Custom Claims for role-based access.

---

## 2. Firestore Data Model Design

The proposed data model is designed to be efficient, scalable, and easy to secure. It revolves around four primary root collections.

### Collections

#### `/users/{uid}`
-   **Purpose:** Stores public and private profile information for each user. The document ID `{uid}` will be the user's unique UID from Firebase Authentication.
-   **Schema:**
    ```json
    {
      "email": "user@example.com",
      "firstName": "Pikachu",
      "lastName": "Raichu",
      "role": "User", // 'User' | 'Admin' - managed via Custom Claims
      "activeIdentityId": "some_uid_DOM", // Reference to the active doc in /identities
      "tokensUsedTotal": 10500, // Aggregate count
      "estimatedCostTotal": 0.045, // Aggregate cost
      "createdAt": "2023-10-27T10:00:00Z",
      // ... other fields from UserProfile
    }
    ```

#### `/funds/{fundCode}`
-   **Purpose:** A new first-class collection to store the configuration for each relief fund. This decouples fund parameters from the client-side code.
-   **Schema:**
    ```json
    {
      "name": "Blastoise Relief Fund",
      "limits": { "twelveMonthMax": 10000, ... },
      "eligibleCountries": ["US", "CA"],
      // ... other fields from the Fund type
    }
    ```

#### `/identities/{uid}_{fundCode}`
-   **Purpose:** Stores each user's relationship with a specific fund using a deterministic ID for easy lookups and security rules.
-   **Schema:**
    ```json
    {
      "uid": "firebase-auth-uid", // UID of the user this identity belongs to
      "fundCode": "DOM",
      "fundName": "Blastoise Relief Fund", // Denormalized for display
      "classVerificationStatus": "passed",
      "eligibilityStatus": "Eligible",
      "lastVerifiedAt": "2023-10-27T10:00:00Z",
      "isActive": true
    }
    ```

#### `/applications/{applicationId}`
-   **Purpose:** A root collection to store every application. This structure facilitates admin-level queries across all users.
-   **Schema:**
    ```json
    {
      "uid": "firebase-auth-uid", // UID of the applicant
      "submittedBy": "firebase-auth-uid-of-admin", // UID of proxy if applicable
      "fundCode": "DOM",
      "status": "Awarded",
      "submittedAt": "2023-08-12T10:00:00Z",
      "profileSnapshot": { ... }, // A complete copy of the UserProfile at submission
      // ... other fields from Application
    }
    ```

#### `/tokenEvents/{eventId}`
- **Purpose:** Stores a detailed record of every individual AI API call for analytics and auditing.
- **Schema:**
    ```json
    {
        "uid": "firebase-auth-uid",
        "userId": "user@example.com",
        "fundCode": "DOM",
        "feature": "AI Assistant",
        "model": "gemini-2.5-flash",
        "inputTokens": 500,
        "outputTokens": 250,
        "timestamp": "2023-10-28T12:00:00Z"
        // ... other fields from TokenEvent
    }
    ```

#### `/users/{uid}/chatSessions/{sessionId}/messages/{messageId}`
- **Purpose:** Stores the chat history for the AI Relief Assistant for each user. This nested structure ensures chat data is private and secure.

---

## 3. Client Architecture

To ensure the application is maintainable and not tightly coupled to Firebase, we will implement a repository/adapter pattern. UI components will interact with provider-agnostic interfaces, and concrete Firebase implementations will handle the data logic.

-   **`core/` directory:** Will contain the business logic and interfaces.
    -   `core/auth/AuthClient.ts`: Interface for authentication methods (`register`, `signIn`, `signOut`, `onAuthStateChanged`).
    -   `core/data/UsersRepo.ts`, `IdentitiesRepo.ts`, `ApplicationsRepo.ts`, `FundsRepo.ts`: Interfaces defining data access methods (e.g., `getUser(uid)`, `getApplicationsForUser(uid)`).

-   **`infra/firebase/` directory:** Will contain the concrete implementations.
    -   `infra/firebase/FirebaseAuthClient.ts`: Implements `AuthClient` using the Firebase Auth SDK.
    -   `infra/firebase/FirestoreUsersRepo.ts`, etc.: Implement the repository interfaces using the Firestore SDK.

-   **State Management:**
    -   A simple `useAuth()` hook will manage the current user, loading state, and custom claims.
    -   **TanStack Query (`@tanstack/react-query`)** is recommended for managing server state, including fetching, caching, and mutations. It pairs well with repository methods and can integrate with Firestore's `onSnapshot` for real-time updates.

---

## 4. Authentication & Authorization

We will use **Firebase Authentication** with the Email/Password provider. Admin roles will be managed using **Custom Claims** for maximum security.

### User Flows
1.  **Registration/Login:** UI components will call methods on the `AuthClient` interface (e.g., `authClient.register(...)`).
2.  **Global State:** An `onAuthStateChanged` listener in `App.tsx` will detect the authenticated user, fetch their custom claims, and retrieve their profile from the `UsersRepo`.

### Admin Role Management
-   **Custom Claims:** An admin user will have a `{ admin: true }` claim set on their authentication token. This is the source of truth for authorization.
-   **Implementation:** A callable Cloud Function, `setAdmin(data: {uid: string, makeAdmin: boolean})`, will be created. This function will be protected; only an already authenticated admin can call it to grant or revoke admin privileges for another user.
-   **Security:** This approach is highly secure, as claims are verified on the backend by Firestore Security Rules, preventing unauthorized access.

---

## 5. Firestore Security Rules & Indexes

### Security Rules
The following rules provide a secure, function-based foundation that correctly handles user and admin roles.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthed() { return request.auth != null; }
    function isAdmin() { return isAuthed() && request.auth.token.admin == true; }
    function isSelf(uid) { return isAuthed() && request.auth.uid == uid; }

    // Default deny
    match /{document=**} { allow read, write: if false; }

    // App needs fund params to function
    match /funds/{fundCode} {
      allow read: if isAuthed();
      allow write: if isAdmin();
    }

    match /users/{uid} {
      allow read, update: if isSelf(uid) || isAdmin();
      allow create: if isSelf(uid);
      allow delete: if false;
    }

    match /identities/{identityId} {
      allow read: if isAdmin() || (isAuthed() && resource.data.uid == request.auth.uid);
      allow create: if isSelf(request.resource.data.uid) || isAdmin();
      allow update: if isAdmin() || (isSelf(resource.data.uid) && request.resource.data.diff(resource.data).changedKeys().hasOnly(['isActive']));
      allow delete: if isAdmin();
    }

    match /applications/{appId} {
      allow read: if isAdmin() || (isAuthed() && resource.data.uid == request.auth.uid);
      allow create: if isAdmin() || (isSelf(request.resource.data.uid));
      allow update, delete: if isAdmin();
    }
    
    match /tokenEvents/{eventId} {
      allow create: if isSelf(request.resource.data.uid);
      allow read: if isAdmin() && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.fundCode == resource.data.fundCode
      );
      allow update, delete: if false;
    }

    match /users/{uid}/chatSessions/{sid}/messages/{mid} {
      allow read, create: if isSelf(uid) || isAdmin();
      allow update, delete: if false;
    }
  }
}
```

### Required Indexes
The following composite indexes must be created in Firestore to support admin queries and prevent runtime errors.

```json
{
  "indexes": [
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "submittedDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "identities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "fundCode", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tokenEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
     {
      "collectionGroup": "tokenEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}

```

---

## 6. Step-by-Step Implementation Guide

### Phase 0: Project Setup
1.  **Firebase Project:** Create a project in the Firebase Console.
2.  **Enable Services:** Enable **Authentication** (Email/Password provider) and **Firestore**.
3.  **Install SDKs:** `npm install firebase @tanstack/react-query`.
4.  **Configure:** Create `services/firebase.ts` with your project configuration keys (use environment variables).
5.  **Seed Data:** Create a script to seed the `/funds` collection with your initial fund configurations.

### Phase 1: Architecture & Authentication
1.  **Create Interfaces:** Define the `AuthClient` and repository interfaces in the `core/` directory.
2.  **Implement Firebase Adapters:** Create the concrete Firebase implementations in the `infra/firebase/` directory.
3.  **Refactor Auth:** Replace mock logic in `LoginPage` and `RegisterPage` to use the `AuthClient`.
4.  **Global State:** Implement the `onAuthStateChanged` listener in `App.tsx` to set the global auth state. Upon successful registration, use the `UsersRepo` to create the user's document in Firestore.

### Phase 2: Data Layer Migration
1.  **Remove Mock DB:** Delete the entire `// --- MOCK DATABASE ---` block from `App.tsx`.
2.  **Integrate TanStack Query:** Wrap the root of the app with `QueryClientProvider`.
3.  **Replace State with Queries:** Systematically replace all `useState` calls that held mock data with `useQuery` hooks that call repository methods (e.g., `useQuery(['applications', user.uid], () => applicationsRepo.getForUser(user.uid))`).
4.  **Refactor Write Operations:** Replace all data-mutating handlers (`handleApplicationSubmit`, `handleProfileUpdate`) with `useMutation` hooks that call the appropriate repository methods.

### Phase 3: Security & Testing
1.  **Deploy Rules & Indexes:** Deploy the `firestore.rules` and `firestore.indexes.json` files to your project.
2.  **Emulator Suite:** Use the Firebase Local Emulator Suite for all development. This provides a safe, local environment for testing.
3.  **Rules Testing:** Write unit tests for your security rules using `@firebase/rules-unit-testing` to verify that user/admin permissions are correctly enforced.
4.  **End-to-End Testing:** Manually test the full user flows: registration -> verification -> application -> profile view -> admin view.

### Phase 4: Admin & Cloud Functions
1.  **Deploy Admin Function:** Deploy the `setAdmin` callable Cloud Function to manage roles.
2.  **Guard Admin UI:** Refactor admin-only components to check `claims.admin` from the `useAuth` hook before rendering.
3.  **(Optional) Implement Fan-Out Function:** Create a Cloud Function triggered on `/applications` writes to create the mirrored document in `/users/{uid}/applications`.