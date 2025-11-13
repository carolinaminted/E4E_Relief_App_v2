import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { auth } from './firebase';
import type { IAuthClient } from './authClient';
import { usersRepo, fundsRepo } from './firestoreRepo';

class FirebaseAuthClient implements IAuthClient {

    onAuthStateChanged(callback: (user: User | null, token: any | null) => void) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdTokenResult();
                callback(user, token);
            } else {
                callback(null, null);
            }
        });
    }

    async register(email: string, password: string, firstName: string, lastName: string, fundCode: string) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // DEFERRED: The fund name is no longer fetched here to avoid a permissions race condition.
            // It will be hydrated in App.tsx after the user's auth state is stable (e.g., after verification).

            // Create user profile document in Firestore
            await usersRepo.add({
                uid: user.uid,
                identityId: email,
                activeIdentityId: null,
                firstName,
                lastName,
                email,
                mobileNumber: '',
                primaryAddress: { country: '', street1: '', city: '', state: '', zip: '' },
                employmentStartDate: '',
                eligibilityType: '',
                householdIncome: '',
                householdSize: '',
                homeowner: '',
                isMailingAddressSame: null,
                ackPolicies: false,
                commConsent: false,
                infoCorrect: false,
                fundCode: fundCode.toUpperCase(), // Store the code, but not the name yet.
                fundName: '', // This will be populated later.
                classVerificationStatus: 'pending',
                eligibilityStatus: 'Not Eligible',
            }, user.uid);

            return { success: true };
        } catch (error: any) {
            console.error("Registration error:", error);
            return { success: false, error: error.message };
        }
    }

    async createProxyUser(email: string, password: string): Promise<{ success: boolean; error?: string; user: User}> {
        try {
            // This is a simplified example. In a real app, this would be handled by a secure backend function
            // to avoid creating users on the client side without proper authorization.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            console.error("Proxy user creation error:", error);
            // If user already exists, we can try to fetch them. This is not secure client-side.
            // For this project, we'll assume creation is the main path and errors are fatal.
            throw new Error(error.message);
        }
    }

    async signIn(email: string, password: string): Promise<boolean> {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Sign in error:", error);
            return false;
        }
    }

    async signOut(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }
}

export const authClient = new FirebaseAuthClient();